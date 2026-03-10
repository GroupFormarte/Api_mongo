import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dev_mongo';

const ASIGNATURAS_SABER11 = [
  'Lectura Crítica', 'Matemáticas', 'Ciencias Naturales',
  'Ciencias Sociales', 'Inglés', 'Competencia lectora',
  'Competencia Lectora', 'Análisis Textual', 'Biología',
  'Física', 'Química', 'Competencia Ciudadana',
];

async function calcularDiscriminacion() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;

  // 1. Scores de todos los estudiantes (students + Estudiantes)
  const scoresMap = new Map<string, number>();

  const enStudents = await db.collection('students')
    .find({ scoreSimulacro: { $exists: true, $gt: 0 } }, { projection: { id_estudiante: 1, scoreSimulacro: 1 } })
    .toArray();

  const enEstudiantes = await db.collection('Estudiantes')
    .find({ scoreSimulacro: { $exists: true, $gt: 0 } }, { projection: { id_student: 1, scoreSimulacro: 1 } })
    .toArray();

  for (const s of enStudents)    scoresMap.set(s.id_estudiante, s.scoreSimulacro);
  for (const s of enEstudiantes) scoresMap.set(s.id_student,    s.scoreSimulacro);

  console.log(`👥 Estudiantes con score: ${scoresMap.size}`);

  // 2. Cuartiles 27% superior e inferior
  const estudiantesOrdenados = Array.from(scoresMap.entries())
    .sort((a, b) => b[1] - a[1]);

  const n27 = Math.max(1, Math.floor(estudiantesOrdenados.length * 0.27));
  const grupoSuperior = new Set(estudiantesOrdenados.slice(0, n27).map(([id]) => id));
  const grupoInferior = new Set(estudiantesOrdenados.slice(-n27).map(([id]) => id));

  console.log(`📈 Grupo superior (27%): ${grupoSuperior.size} estudiantes`);
  console.log(`📉 Grupo inferior (27%): ${grupoInferior.size} estudiantes`);

  // 3. Respuestas Saber 11 agrupadas por pregunta
  const respuestasPorPregunta = await db.collection('resultados_preguntas').aggregate([
    { $match: { asignatura: { $in: ASIGNATURAS_SABER11 } } },
    { $group: {
      _id: '$idPregunta',
      respuestas: { $push: { idEstudiante: '$idEstudiante', respuesta: '$respuesta' } }
    }}
  ]).toArray();

  console.log(`\n📝 Preguntas a procesar: ${respuestasPorPregunta.length}`);

  // 4. Calcular discriminación
  let actualizadas = 0;
  let sinDatos = 0;
  const discriminaciones: number[] = [];
  const bulkOps: any[] = [];

  for (const pregunta of respuestasPorPregunta) {
    const idPregunta = pregunta._id?.toString();
    if (!idPregunta) continue;

    const respSuperior = pregunta.respuestas.filter((r: any) => grupoSuperior.has(r.idEstudiante));
    const respInferior = pregunta.respuestas.filter((r: any) => grupoInferior.has(r.idEstudiante));

    if (respSuperior.length < 3 || respInferior.length < 3) { sinDatos++; continue; }

    const pctSuperior = respSuperior.filter((r: any) => r.respuesta).length / respSuperior.length;
    const pctInferior = respInferior.filter((r: any) => r.respuesta).length / respInferior.length;
    const discrimination = parseFloat((pctSuperior - pctInferior).toFixed(4));

    const status = discrimination >= 0.3 ? 'ok' : discrimination >= 0.1 ? 'revisar' : 'descartar';
    discriminaciones.push(discrimination);

    bulkOps.push({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(idPregunta) },
        update: {
          $set: {
            discrimination,
            status,
            pctSuperior: parseFloat(pctSuperior.toFixed(4)),
            pctInferior: parseFloat(pctInferior.toFixed(4)),
            lastDiscriminacionCalculo: new Date(),
          }
        }
      }
    });
    actualizadas++;
  }

  if (bulkOps.length > 0) {
    await db.collection('contadores_preguntas').bulkWrite(bulkOps);
  }

  const promedio  = discriminaciones.reduce((s, d) => s + d, 0) / discriminaciones.length;
  const ok        = discriminaciones.filter(d => d >= 0.3).length;
  const revisar   = discriminaciones.filter(d => d >= 0.1 && d < 0.3).length;
  const descartar = discriminaciones.filter(d => d < 0.1).length;

  console.log('\n═══════════════════════════════════════');
  console.log('✅ Discriminación calculada');
  console.log(`   Preguntas actualizadas:  ${actualizadas}`);
  console.log(`   Sin datos suficientes:   ${sinDatos}`);
  console.log(`   Discriminación promedio: ${promedio.toFixed(3)}`);
  console.log(`   ✅ ok (≥0.3):            ${ok}`);
  console.log(`   ⚠️  revisar (0.1–0.3):   ${revisar}`);
  console.log(`   ❌ descartar (<0.1):     ${descartar}`);
  console.log('═══════════════════════════════════════');

  await mongoose.disconnect();
}

calcularDiscriminacion().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});