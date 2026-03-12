import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dev_mongo';

const CONFIG_EXAMEN = {
  saber11: {
    asignaturas: [
      'Lectura Crítica', 'Matemáticas', 'Ciencias Naturales',
      'Ciencias Sociales', 'Inglés', 'Competencia lectora',
      'Competencia Lectora', 'Análisis Textual', 'Biología',
      'Física', 'Química', 'Competencia Ciudadana',
    ],
    scoreField: 'scoreSimulacro',
    minRespuestasCalibrar: 30,
    label: 'Saber 11',
  },
  unal: {
    asignaturas: [
      'Razonamiento Lógico', 'Razonamiento lógico matemático',
      'Competencia Lectora', 'Competencia lectora',
      'Análisis Textual', 'Análisis de la Imagen',
      'Ciencias Naturales', 'Ciencias Sociales',
      'Competencia Ciudadana', 'Biología', 'Física', 'Química',
    ],
    scoreField: 'scoreUnal',
    minRespuestasCalibrar: 20,
    label: 'UNAL',
  },
} as const;

type TipoExamen = keyof typeof CONFIG_EXAMEN;

async function calcularDiscriminacionParaTipo(
  db: mongoose.mongo.Db,
  tipo: TipoExamen,
): Promise<void> {
  const config = CONFIG_EXAMEN[tipo];
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 Calculando discriminación — ${config.label}`);
  console.log('═'.repeat(50));

  const scoresMap = new Map<string, number>();

  const enStudents = await db.collection('students')
    .find(
      { [config.scoreField]: { $exists: true } },
      { projection: { id_estudiante: 1, [config.scoreField]: 1 } },
    ).toArray();

  for (const s of enStudents) {
    if (s.id_estudiante) scoresMap.set(String(s.id_estudiante), s[config.scoreField]);
  }

  if (tipo === 'saber11') {
    const enEstudiantes = await db.collection('Estudiantes').aggregate([
      { $match: { id_student: { $exists: true, $nin: [null, ''] } } },
      {
        $project: {
          id_student: 1,
          maxScore: {
            $max: {
              $map: {
                input: { $ifNull: ['$grados', []] },
                as: 'g',
                in: { $ifNull: ['$$g.scoreSimulacro', 0] },
              },
            },
          },
        }
      },
      { $match: { maxScore: { $gt: 0 } } },
    ]).toArray();

    for (const s of enEstudiantes) {
      scoresMap.set(String(s.id_student), s.maxScore);
    }
  }

  console.log(`👥 Estudiantes con score ${config.scoreField}: ${scoresMap.size}`);

  if (scoresMap.size < 6) {
    console.log(`⚠️  Muy pocos estudiantes con score (${scoresMap.size}). Se necesitan al menos 6.`);
    if (tipo === 'unal') {
      console.log(`   Ejecuta primero el endpoint /api/scoring/unal/calcular-batch para poblar scoreUnal.`);
    }
    return;
  }

  const estudiantesOrdenados = Array.from(scoresMap.entries())
    .sort((a, b) => b[1] - a[1]);

  const n27 = Math.max(1, Math.floor(estudiantesOrdenados.length * 0.27));
  const grupoSuperior = new Set(estudiantesOrdenados.slice(0, n27).map(([id]) => id));
  const grupoInferior = new Set(estudiantesOrdenados.slice(-n27).map(([id]) => id));

  console.log(`📈 Grupo superior (27%): ${grupoSuperior.size} estudiantes`);
  console.log(`📉 Grupo inferior (27%): ${grupoInferior.size} estudiantes`);

  const respuestasPorPregunta = await db.collection('resultados_preguntas').aggregate([
    { $match: { asignatura: { $in: config.asignaturas as unknown as string[] } } },
    {
      $group: {
        _id: '$idPregunta',
        asignatura: { $first: '$asignatura' },
        respuestas: { $push: { idEstudiante: '$idEstudiante', respuesta: '$respuesta' } },
      }
    },
  ]).toArray();

  console.log(`\n📝 Preguntas a procesar: ${respuestasPorPregunta.length}`);

  let actualizadas = 0;
  let sinDatos = 0;
  const discriminaciones: number[] = [];
  const bulkOps: any[] = [];

  for (const pregunta of respuestasPorPregunta) {
    const idPregunta = pregunta._id?.toString();
    if (!idPregunta) continue;

    const respSuperior = pregunta.respuestas.filter((r: any) =>
      grupoSuperior.has(String(r.idEstudiante)));
    const respInferior = pregunta.respuestas.filter((r: any) =>
      grupoInferior.has(String(r.idEstudiante)));

    if (respSuperior.length < 3 || respInferior.length < 3) { sinDatos++; continue; }

    const pctSuperior = respSuperior.filter((r: any) => r.respuesta === true).length / respSuperior.length;
    const pctInferior = respInferior.filter((r: any) => r.respuesta === true).length / respInferior.length;
    const discrimination = parseFloat((pctSuperior - pctInferior).toFixed(4));
    const totalRespuestas = pregunta.respuestas.length;

    const status = discrimination >= 0.3 ? 'ok'
      : discrimination >= 0.1 ? 'revisar'
        : 'descartar';

    discriminaciones.push(discrimination);

    bulkOps.push({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(idPregunta) },
        update: {
          $set: {
            discrimination,
            status,
            tipo_examen: tipo,
            pctSuperior: parseFloat(pctSuperior.toFixed(4)),
            pctInferior: parseFloat(pctInferior.toFixed(4)),
            is_calibrated: totalRespuestas >= config.minRespuestasCalibrar,
            total_answers: totalRespuestas,
            lastDiscriminacionCalculo: new Date(),
          },
        },
      },
    });
    actualizadas++;
  }

  if (bulkOps.length > 0) {
    await db.collection('contadores_preguntas').bulkWrite(bulkOps, { ordered: false });
  }

  const promedio = discriminaciones.length > 0
    ? discriminaciones.reduce((s, d) => s + d, 0) / discriminaciones.length
    : 0;
  const ok = discriminaciones.filter(d => d >= 0.3).length;
  const revisar = discriminaciones.filter(d => d >= 0.1 && d < 0.3).length;
  const descartar = discriminaciones.filter(d => d < 0.1).length;

  console.log(`\n✅ Discriminación ${config.label} calculada`);
  console.log(`   Preguntas actualizadas:  ${actualizadas}`);
  console.log(`   Sin datos suficientes:   ${sinDatos}`);
  if (discriminaciones.length > 0) {
    console.log(`   Discriminación promedio: ${promedio.toFixed(3)}`);
    console.log(`   ✅ ok (≥0.3):            ${ok}`);
    console.log(`   ⚠️  revisar (0.1–0.3):   ${revisar}`);
    console.log(`   ❌ descartar (<0.1):     ${descartar}`);
  }
}

async function run(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;
  console.log('✅ Conectado a MongoDB');

  const tipoArg = process.argv.find(a => a.startsWith('--tipo='))?.split('=')[1] as TipoExamen | undefined;

  if (tipoArg && !CONFIG_EXAMEN[tipoArg]) {
    console.error(`❌ Tipo inválido: ${tipoArg}. Usa: saber11 | unal`);
    process.exit(1);
  }

  const tipos: TipoExamen[] = tipoArg ? [tipoArg] : ['saber11', 'unal'];

  for (const tipo of tipos) {
    await calcularDiscriminacionParaTipo(db, tipo);
  }

  await mongoose.disconnect();
  console.log('\n✅ Listo\n');
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});