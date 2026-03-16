import mongoose from 'mongoose';
import { AreaSaber11, ContadorPregunta, PuntajeArea, ResultadoSemiIRT } from '../../domain/interfaces/saberInterfaces';
import { mapAsignaturaToAreaIcfes } from '../mappers/icfesSubjectMapper';

// ─── Peso Semi-IRT ───
/**
 * Calcula el peso de una pregunta según sus datos históricos.
 * 
 * La ponderación se determina por el número total de respuestas y el nivel de dificultad:
 * - Si el contador no está definido o el total de respuestas es inferior a 10: devuelve 0,5. (sin datos suficientes)
 * - Si el total de respuestas es inferior a 200: devuelve la media de (1 - dificultad) y 0,5.
 * - En caso contrario: devuelve (1 - dificultad) limitado entre 0,1 y 0,9.
 */
function calcularPeso(contador: ContadorPregunta | undefined): number {
  if (!contador || contador.total_answers < 10) return 0.5;

  if (contador.status === 'descartar') return 0.3;

  const pesoReal = 1 - contador.difficulty;
  const disc = contador.discrimination ?? 0.3;

  const pesoCombinado = (pesoReal * 0.7) + (disc * 0.3);

  if (contador.total_answers < 200) {
    return parseFloat(((pesoCombinado + 0.5) / 2).toFixed(4));
  }

  return parseFloat(Math.min(0.9, Math.max(0.1, pesoCombinado)).toFixed(4));
}

function calcularPuntajeSaber11(areas: Map<AreaSaber11, number>): number {
  const lc = areas.get('Lectura Crítica') ?? 0;
  const ma = areas.get('Matemáticas') ?? 0;
  const cn = areas.get('Ciencias Naturales') ?? 0;
  const cs = areas.get('Sociales y Ciudadanas') ?? 0;
  const ing = areas.get('Inglés') ?? 0;

  const ig = (3 * lc + 3 * ma + 3 * cn + 3 * cs + ing) / 13;
  return parseFloat(Math.min(500, Math.max(0, ig * 5)).toFixed(1));
}

function calcularIRTDesdeRespuestas(
  respuestas: Array<{ asignatura: string; respuesta: boolean; idPregunta: string }>,
  contadorMap: Map<string, ContadorPregunta>,
): { areaNormalizada: Map<AreaSaber11, number>; areasDetalle: PuntajeArea[] } {
  const areaPesoTotal = new Map<AreaSaber11, number>();
  const areaPesoCorrecto = new Map<AreaSaber11, number>();
  const areaStats = new Map<AreaSaber11, { correctas: number; incorrectas: number }>();

  for (const resp of respuestas) {
    const area = mapAsignaturaToAreaIcfes(resp.asignatura);
    if (!area) continue;

    const peso = calcularPeso(contadorMap.get(resp.idPregunta));
    areaPesoTotal.set(area, (areaPesoTotal.get(area) ?? 0) + peso);
    areaPesoCorrecto.set(area, (areaPesoCorrecto.get(area) ?? 0) + (resp.respuesta ? peso : 0));

    if (!areaStats.has(area)) areaStats.set(area, { correctas: 0, incorrectas: 0 });
    resp.respuesta
      ? areaStats.get(area)!.correctas++
      : areaStats.get(area)!.incorrectas++;
  }

  const areaNormalizada = new Map<AreaSaber11, number>();
  const areasDetalle: PuntajeArea[] = [];

  for (const [area, pesoTotal] of areaPesoTotal) {
    const pesoCorrecto = areaPesoCorrecto.get(area) ?? 0;
    const puntaje = pesoTotal > 0
      ? parseFloat(((pesoCorrecto / pesoTotal) * 100).toFixed(1))
      : 0;
    areaNormalizada.set(area, puntaje);
    const stats = areaStats.get(area)!;
    areasDetalle.push({
      area, puntaje,
      correctas: stats.correctas,
      incorrectas: stats.incorrectas,
      total: stats.correctas + stats.incorrectas,
    });
  }

  return { areaNormalizada, areasDetalle };
}

export class SemiIrtScoringService {
  private db: mongoose.mongo.Db;

  constructor(db: mongoose.mongo.Db) {
    this.db = db;
  }

  // ─── calcularDesdeSubjects (individual, sin IRT) ──────────────────────────
  async calcularDesdeSubjects(
    idEstudiante: string,
    idInstituto: string,
    idSimulacro: string | null,
    subjects: Array<{ name: string; correctAnswers: number; incorrectAnswers: number }>,
  ): Promise<{
    score: number; position: number; totalStudents: number;
    correctAnswers: number; incorrectAnswers: number; totalAnswered: number;
    areas: PuntajeArea[];
  }> {
    const areaNormalizada = new Map<AreaSaber11, number>();
    const areasDetalle: PuntajeArea[] = [];
    let totalCorrectas = 0;
    let totalIncorrectas = 0;

    for (const subject of subjects) {
      const area = mapAsignaturaToAreaIcfes(subject.name);
      if (!area) continue;
      const correctas = subject.correctAnswers ?? 0;
      const incorrectas = subject.incorrectAnswers ?? 0;
      const total = correctas + incorrectas;
      if (total === 0) continue;
      const puntajeBase = parseFloat(((correctas / total) * 100).toFixed(1));
      areaNormalizada.set(area, puntajeBase);
      areasDetalle.push({ area, puntaje: puntajeBase, correctas, incorrectas, total });
      totalCorrectas += correctas;
      totalIncorrectas += incorrectas;
    }

    const puntajeGlobal = calcularPuntajeSaber11(areaNormalizada);
    const { position, totalStudents } = await this.calcularPosicion(idEstudiante, idInstituto, puntajeGlobal);

    await this.guardarEnEstudiante({
      idEstudiante, idInstituto, puntajeGlobal,
      areas: areasDetalle, fechaCalculo: new Date(), sesionesDetectadas: 1,
    });

    return {
      score: puntajeGlobal, position, totalStudents,
      correctAnswers: totalCorrectas, incorrectAnswers: totalIncorrectas,
      totalAnswered: totalCorrectas + totalIncorrectas,
      areas: areasDetalle,
    };
  }

  // ─── calcularBatch (grupal, Semi-IRT desde resultados_preguntas) ──────────
  async calcularBatch(
    idInstituto: string,
    idSimulacro: string | null,
    estudiantes: Array<{ idEstudiante: string; subjects: Array<{ name: string; correctAnswers: number; incorrectAnswers: number }> }>,
  ): Promise<Record<string, {
    score: number; position: number; totalStudents: number;
    correctAnswers: number; incorrectAnswers: number; totalAnswered: number;
    areas: PuntajeArea[];
  }>> {

    // ── 1. Leer todas las respuestas del simulacro en una sola query ──────────
    const ids = estudiantes.map(e => e.idEstudiante);
    const todasRespuestas = await this.db
      .collection('resultados_preguntas')
      .find({
        idEstudiante: { $in: ids },
        idInstituto,
        ...(idSimulacro ? { idSimulacro } : {}),
      })
      .toArray();

    // ── 2. Pesos IRT de todas las preguntas involucradas ─────────────────────
    const idPreguntas = [...new Set(todasRespuestas.map((r: any) => r.idPregunta as string))];
    const objectIds = idPreguntas
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const contadores = await this.db
      .collection('contadores_preguntas')
      .find({ _id: { $in: objectIds } })
      .toArray();

    const contadorMap = new Map<string, ContadorPregunta>();
    for (const c of contadores) contadorMap.set(c._id.toString(), c as unknown as ContadorPregunta);

    // ── 3. Agrupar respuestas por estudiante ─────────────────────────────────
    const respuestasPorEstudiante = new Map<string, Array<{ asignatura: string; respuesta: boolean; idPregunta: string }>>();
    for (const r of todasRespuestas as any[]) {
      const id = r.idEstudiante as string;
      if (!respuestasPorEstudiante.has(id)) respuestasPorEstudiante.set(id, []);
      respuestasPorEstudiante.get(id)!.push({
        asignatura: r.asignatura,
        respuesta: r.respuesta,
        idPregunta: r.idPregunta,
      });
    }

    // ── 4. Calcular puntaje por estudiante (IRT si hay respuestas, fallback si no) ──
    const puntajes: Array<{
      idEstudiante: string; score: number;
      correctAnswers: number; incorrectAnswers: number; areas: PuntajeArea[];
    }> = [];

    for (const est of estudiantes) {
      const respuestas = respuestasPorEstudiante.get(est.idEstudiante);

      if (respuestas && respuestas.length > 0) {
        // ✅ Semi-IRT completo desde resultados_preguntas
        const { areaNormalizada, areasDetalle } = calcularIRTDesdeRespuestas(respuestas, contadorMap);
        puntajes.push({
          idEstudiante: est.idEstudiante,
          score: calcularPuntajeSaber11(areaNormalizada),
          correctAnswers: areasDetalle.reduce((s, a) => s + a.correctas, 0),
          incorrectAnswers: areasDetalle.reduce((s, a) => s + a.incorrectas, 0),
          areas: areasDetalle,
        });
      } else {
        // ⚠️  Fallback: subjects simples (race condition o primer simulacro)
        console.warn(`[SemiIRT] Fallback subjects para estudiante=${est.idEstudiante} — sin respuestas en BD`);
        const areaNormalizada = new Map<AreaSaber11, number>();
        const areasDetalle: PuntajeArea[] = [];
        let correctas = 0, incorrectas = 0;

      for (const subject of est.subjects) {
        const area = mapAsignaturaToAreaIcfes(subject.name);
        if (!area) continue;

        const c = subject.correctAnswers ?? 0;
        const i = subject.incorrectAnswers ?? 0;
        const total = c + i;
        if (total === 0) continue;

        const puntajeBase = parseFloat(((c / total) * 100).toFixed(1));
        areaNormalizada.set(area, puntajeBase);
        areasDetalle.push({ area, puntaje: puntajeBase, correctas: c, incorrectas: i, total });
        correctas += c;
        incorrectas += i;
      }

        puntajes.push({
          idEstudiante: est.idEstudiante,
          score: calcularPuntajeSaber11(areaNormalizada),
          correctAnswers: correctas,
          incorrectAnswers: incorrectas,
          areas: areasDetalle,
        });
      }
    }

    // ── 5. Posiciones relativas dentro del grupo ─────────────────────────────
    const scoresOrdenados = [...puntajes].sort((a, b) => b.score - a.score);
    const totalStudents = puntajes.length;
    const ahora = new Date();

    // ── 6. Construir respuesta + bulk writes ─────────────────────────────────
    const resultados: Record<string, any> = {};
    const bulkStudents: any[] = [];
    const bulkEstudiantes: any[] = [];

    for (const p of puntajes) {
      const position = scoresOrdenados.findIndex(s => s.idEstudiante === p.idEstudiante) + 1;

      resultados[p.idEstudiante] = {
        score: p.score,
        position,
        totalStudents,
        correctAnswers: p.correctAnswers,
        incorrectAnswers: p.incorrectAnswers,
        totalAnswered: p.correctAnswers + p.incorrectAnswers,
        areas: p.areas,
      };

      for (const est of estudiantes.slice(0, 3)) {
        const resps = respuestasPorEstudiante.get(est.idEstudiante) ?? [];
        const pesosEst = resps.map(r => calcularPeso(contadorMap.get(r.idPregunta)));
        const pesoPromedio = pesosEst.reduce((s, p) => s + p, 0) / pesosEst.length;
        console.log(`[IRT] Est=${est.idEstudiante} | respuestas=${resps.length} | pesoPromedio=${pesoPromedio.toFixed(4)} | score=${resultados[est.idEstudiante]?.score}`);
      }

      bulkStudents.push({
        updateOne: {
          filter: { id_estudiante: p.idEstudiante },
          update: { $set: { scoreSimulacro: p.score, lastCalculo: ahora, areasSimulacro: p.areas } },
        }
      });

      bulkEstudiantes.push({
        updateOne: {
          filter: { id_student: p.idEstudiante },
          update: { $set: { scoreSimulacro: p.score, lastCalculo: ahora } },
        }
      });
    }

    // ── 7. Guardar en ambas colecciones en paralelo ───────────────────────────
    await Promise.all([
      this.db.collection('students').bulkWrite(bulkStudents, { ordered: false }),
      this.db.collection('Estudiantes').bulkWrite(bulkEstudiantes, { ordered: false }),
    ]);

    return resultados;
  }

  // ─── calcularPosicion ─────────────────────────────────────────────────────
  private async calcularPosicion(
    idEstudiante: string,
    idInstituto: string,
    puntajeGlobal: number,
  ): Promise<{ position: number; totalStudents: number }> {

    const studentsConScore = await this.db.collection('students')
      .find(
        { institute_id: idInstituto, scoreSimulacro: { $exists: true, $gt: 0 } },
        { projection: { id_estudiante: 1, scoreSimulacro: 1 } }
      ).toArray();

    const estudiantesConScore = await this.db.collection('Estudiantes')
      .find(
        { idInstituto, scoreSimulacro: { $exists: true, $gt: 0 } },
        { projection: { id_student: 1, scoreSimulacro: 1 } }
      ).toArray();

    const scores = new Map<string, number>();
    for (const s of studentsConScore) scores.set(s.id_estudiante, s.scoreSimulacro);
    for (const s of estudiantesConScore) scores.set(s.id_student, s.scoreSimulacro);
    scores.set(idEstudiante, puntajeGlobal);

    const todosLosScores = Array.from(scores.values()).sort((a, b) => b - a);
    const position = todosLosScores.indexOf(puntajeGlobal) + 1;

    return { position, totalStudents: scores.size };
  }

  // ─── guardarEnEstudiante ──────────────────────────────────────────────────
  private async guardarEnEstudiante(resultado: ResultadoSemiIRT): Promise<void> {
    const { idEstudiante, puntajeGlobal, fechaCalculo, areas } = resultado;

    const enStudents = await this.db.collection('students').updateOne(
      { id_estudiante: idEstudiante },
      { $set: { scoreSimulacro: puntajeGlobal, lastCalculo: fechaCalculo, areasSimulacro: areas } }
    );

    if (enStudents.matchedCount === 0) {
      await this.db.collection('Estudiantes').updateOne(
        { id_student: idEstudiante },
        { $set: { scoreSimulacro: puntajeGlobal, lastCalculo: fechaCalculo } }
      );
    }
  }
}
