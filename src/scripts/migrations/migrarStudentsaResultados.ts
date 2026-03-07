import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dev_mongo';

function competenciaToAsignatura(competence: string): string | null {
  const c = competence.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (c.includes('interpretacion y representacion') ||
      c.includes('formulacion y ejecucion') ||
      c.includes('argumentacion'))                          return 'Matemáticas';

  if (c.includes('reflexiona y evalua') ||
      c.includes('comprende') ||
      c.includes('identifica y entiende'))                  return 'Lectura Crítica';

  if (c.includes('pensamiento reflexivo') ||
      c.includes('interpretacion y analisis') ||
      c.includes('pensamiento social') ||
      c.includes('mecanismos de participacion'))            return 'Ciencias Sociales';

  if (c.includes('uso del conocimiento') ||
      c.includes('explicacion de fenomenos') ||
      c.includes('indagacion'))                             return 'Ciencias Naturales';

  if (c.includes('semantica') ||
      c.includes('pragmatica') ||
      c.includes('gramatical'))                             return 'Inglés';

  return null;
}

async function migrar() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;

  console.log('✅ Conectado a MongoDB');
  console.log('📋 Iniciando migración students → resultados_preguntas...\n');

  const students = await db.collection('students').find({
    examenes_asignados: { $exists: true, $ne: [] }
  }).toArray();

  console.log(`👥 Estudiantes con exámenes: ${students.length}`);

  let totalInsertados = 0;
  let totalOmitidos   = 0;
  let totalSinMapeo   = 0;
  let estudiantesProcesados = 0;

  for (const student of students) {
    const idEstudiante = student.id_estudiante ?? student.id?.toString() ?? student._id.toString();
    const idInstituto  = student.institute_id?.toString() ?? student.id_campus?.toString() ?? '0';

    if (!student.examenes_asignados?.length) continue;

    for (const examen of student.examenes_asignados) {
      const idSimulacro = examen.id_simulacro ?? examen.idSimulacro ?? null;

      if (!examen.respuesta_sesion?.length) continue;

      for (const sesion of examen.respuesta_sesion) {
        if (!sesion.respuestas?.length) continue;

        // Fecha de creación — usar la del examen o ahora
        const dateCreated = examen.fecha
          ?? examen.createdAt
          ?? new Date().toISOString().replace('T', ' ').substring(0, 23);

        const docs = [];

        for (const respuesta of sesion.respuestas) {
          const idPregunta = respuesta.id_pregunta ?? respuesta.idPregunta;
          if (!idPregunta) { totalOmitidos++; continue; }

          if (!respuesta.id_respuesta && !respuesta.es_correcta) {
            // Puede ser pregunta no respondida, la incluimos como incorrecta
          }

          const asignatura = competenciaToAsignatura(respuesta.competence ?? '');
          if (!asignatura) {
            totalSinMapeo++;
            continue;
          }

          const existe = await db.collection('resultados_preguntas').findOne({
            idPregunta,
            idEstudiante,
            idInstituto,
            ...(idSimulacro ? { idSimulacro } : {}),
          });

          if (existe) { totalOmitidos++; continue; }

          docs.push({
            idPregunta,
            asignatura,
            idAsignatura: idPregunta,
            idEstudiante,
            idInstituto,
            ...(idSimulacro ? { idSimulacro } : {}),
            respuesta:   respuesta.es_correcta === true,
            dateCreated,
            __v: 0,
          });
        }

        if (docs.length > 0) {
          await db.collection('resultados_preguntas').insertMany(docs, { ordered: false });
          totalInsertados += docs.length;
        }
      }
    }

    estudiantesProcesados++;
    if (estudiantesProcesados % 10 === 0) {
      console.log(`  ⏳ Procesados: ${estudiantesProcesados}/${students.length} estudiantes...`);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('✅ Migración completada');
  console.log(`   Estudiantes procesados: ${estudiantesProcesados}`);
  console.log(`   Documentos insertados:  ${totalInsertados}`);
  console.log(`   Omitidos (duplicados):  ${totalOmitidos}`);
  console.log(`   Sin mapeo de área:      ${totalSinMapeo}`);
  console.log('═══════════════════════════════════════');

  await mongoose.disconnect();
}

migrar().catch(err => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});