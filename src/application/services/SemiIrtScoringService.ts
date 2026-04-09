import mongoose from 'mongoose';
import { AreaSaber11, ContadorPregunta, PuntajeArea, ResultadoSemiIRT } from '../../domain/interfaces/saberInterfaces';
import { mapAsignaturaToAreaIcfes } from './mappers/icfesSubjectMapper';

// ─────────────────────────────────────────────────────────────────────────────
// CAPA 1 — Curva de conversión ICFES
// Fuente: tabla de equivalencias publicada por preicfes y análisis históricos.
// Transforma un porcentaje de aciertos (0-1) al puntaje real ICFES (0-100).
// La curva es NO lineal: subir en la parte alta es mucho más difícil.
// ─────────────────────────────────────────────────────────────────────────────

const CURVA_ICFES: Array<{ pct: number; pts: number }> = [
  { pct: 0.00, pts: 0   },
  { pct: 0.25, pts: 40  },
  { pct: 0.35, pts: 50  },
  { pct: 0.45, pts: 60  },
  { pct: 0.55, pts: 70  },
  { pct: 0.70, pts: 80  },
  { pct: 0.85, pts: 90  },
  { pct: 1.00, pts: 100 },
];

/**
 * Convierte un porcentaje de aciertos al puntaje equivalente en escala ICFES (0-100).
 * Usa interpolación lineal entre los puntos conocidos de la curva oficial.
 *
 * Ejemplos:
 *   0.45 → ~60   (estudiante promedio)
 *   0.55 → ~70   (sobre promedio)
 *   0.70 → ~80   (buen puntaje)
 */
function aplicarCurvaIcfes(pctAciertos: number): number {
  const pct = Math.min(1, Math.max(0, pctAciertos));

  for (let i = 0; i < CURVA_ICFES.length - 1; i++) {
    const p1 = CURVA_ICFES[i];
    const p2 = CURVA_ICFES[i + 1];

    if (pct >= p1.pct && pct <= p2.pct) {
      const t = (pct - p1.pct) / (p2.pct - p1.pct);
      return parseFloat((p1.pts + t * (p2.pts - p1.pts)).toFixed(1));
    }
  }

  return pct >= 1 ? 100 : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPA 2 — Peso Semi-IRT por dificultad
// El peso refleja qué tan confiable es la dificultad histórica de la pregunta.
// Con pocos datos (<100 respuestas) usamos peso neutro (0.5).
// Con más datos, mezclamos gradualmente el peso real con el neutro.
// Con muchos datos (>300) usamos el peso real directamente.
//
// Si la discriminación es negativa (pregunta problemática), penalizamos el peso.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula el peso de una pregunta según sus datos históricos.
 *
 * - Sin datos o <100 respuestas  → peso neutro (0.5)
 * - Status 'descartar'           → peso mínimo (0.3)
 * - Discriminación negativa      → peso mínimo (0.2) — pregunta contraproducente
 * - 100-300 respuestas           → mezcla gradual entre peso real y neutro
 * - >300 respuestas              → peso real basado en dificultad + discriminación
 */
function calcularPeso(contador: ContadorPregunta | undefined): number {
  if (!contador || contador.total_answers < 10) return 0.5;

  if (contador.status === 'descartar') return 0.3;

  const disc = contador.discrimination ?? 0;

  // Pregunta contraproducente: los buenos la fallan, los malos la aciertan
  if (disc < 0) return 0.2;

  // pesoReal: preguntas difíciles pesan más (dificultad baja → peso alto)
  const pesoReal = 1 - contador.difficulty;

  // discrimination normalizada: escala 0-1 (valores típicos 0.1-0.6)
  const discNorm = Math.min(1, Math.max(0, disc));

  // Combinamos dificultad (70%) y discriminación (30%)
  const pesoCombinado = (pesoReal * 0.7) + (discNorm * 0.3);
  const pesoAcotado = Math.min(0.9, Math.max(0.1, pesoCombinado));

  // Mezcla gradual: entre 100 y 300 respuestas interpolamos con peso neutro
  if (contador.total_answers < 300) {
    const confianza = (contador.total_answers - 100) / 200; // 0 a 1
    const pesoMezclado = 0.5 + confianza * (pesoAcotado - 0.5);
    return parseFloat(pesoMezclado.toFixed(4));
  }

  return parseFloat(pesoAcotado.toFixed(4));
}

function calcularPuntajeSaber11(areas: Map<AreaSaber11, number>): number {
  const lc  = areas.get('Lectura Crítica')      ?? 0;
  const ma  = areas.get('Matemáticas')           ?? 0;
  const cn  = areas.get('Ciencias Naturales')    ?? 0;
  const cs  = areas.get('Sociales y Ciudadanas') ?? 0;
  const ing = areas.get('Inglés')                ?? 0;

  const ig = (3 * lc + 3 * ma + 3 * cn + 3 * cs + ing) / 13;
  return parseFloat(Math.min(500, Math.max(0, ig * 5)).toFixed(1));
}

// ─────────────────────────────────────────────────────────────────────────────
// Núcleo del cálculo: combina Capa 1 + Capa 2
//
// Flujo por área:
//   1. Acumular pesos (Capa 2) — preguntas difíciles pesan más
//   2. pctAciertos = pesoCorrecto / pesoTotal
//   3. puntajeArea = aplicarCurvaIcfes(pctAciertos)  — Capa 1
// ─────────────────────────────────────────────────────────────────────────────

function calcularIRTDesdeRespuestas(
  respuestas: Array<{ asignatura: string; respuesta: boolean; idPregunta: string }>,
  contadorMap: Map<string, ContadorPregunta>,
): { areaNormalizada: Map<AreaSaber11, number>; areasDetalle: PuntajeArea[] } {
  const areaPesoTotal    = new Map<AreaSaber11, number>();
  const areaPesoCorrecto = new Map<AreaSaber11, number>();
  const areaStats        = new Map<AreaSaber11, { correctas: number; incorrectas: number }>();

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
    const pesoCorrecto  = areaPesoCorrecto.get(area) ?? 0;
    const pctAciertos   = pesoTotal > 0 ? pesoCorrecto / pesoTotal : 0;

    // Capa 1: convertir porcentaje ponderado a escala ICFES real
    const puntaje = aplicarCurvaIcfes(pctAciertos);

    areaNormalizada.set(area, puntaje);

    const stats = areaStats.get(area)!;
    areasDetalle.push({
      area,
      puntaje,
      correctas:   stats.correctas,
      incorrectas: stats.incorrectas,
      total:       stats.correctas + stats.incorrectas,
    });
  }

  return { areaNormalizada, areasDetalle };
}

/**
 * Fallback cuando no hay respuestas individuales en BD (ej. primer simulacro).
 * Solo recibe totales por asignatura, sin detalle por pregunta.
 * Aplica igualmente la curva ICFES para mantener consistencia de escala.
 */
function calcularDesdeSubjectsFallback(
  subjects: Array<{ name: string; correctAnswers: number; incorrectAnswers: number }>,
): { areaNormalizada: Map<AreaSaber11, number>; areasDetalle: PuntajeArea[]; totalCorrectas: number; totalIncorrectas: number } {
  const areaNormalizada  = new Map<AreaSaber11, number>();
  const areasDetalle: PuntajeArea[] = [];
  let totalCorrectas    = 0;
  let totalIncorrectas  = 0;

  for (const subject of subjects) {
    const area = mapAsignaturaToAreaIcfes(subject.name);
    if (!area) continue;

    const correctas   = subject.correctAnswers   ?? 0;
    const incorrectas = subject.incorrectAnswers  ?? 0;
    const total       = correctas + incorrectas;
    if (total === 0) continue;

    // Sin datos IRT, usamos porcentaje simple — pero igual pasamos por la curva
    const pctAciertos = correctas / total;
    const puntaje     = aplicarCurvaIcfes(pctAciertos);

    areaNormalizada.set(area, puntaje);
    areasDetalle.push({ area, puntaje, correctas, incorrectas, total });

    totalCorrectas   += correctas;
    totalIncorrectas += incorrectas;
  }

  return { areaNormalizada, areasDetalle, totalCorrectas, totalIncorrectas };
}


export class SemiIrtScoringService {
  private db: mongoose.mongo.Db;

  constructor(db: mongoose.mongo.Db) {
    this.db = db;
  }

  // ─── calcularDesdeSubjects (individual, sin respuestas detalladas) ─────────
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
    const { areaNormalizada, areasDetalle, totalCorrectas, totalIncorrectas } =
      calcularDesdeSubjectsFallback(subjects);

    const puntajeGlobal = calcularPuntajeSaber11(areaNormalizada);
    const { position, totalStudents } = await this.calcularPosicion(idEstudiante, idInstituto, puntajeGlobal);

    await this.guardarEnEstudiante({
      idEstudiante, idInstituto, puntajeGlobal,
      areas: areasDetalle, fechaCalculo: new Date(), sesionesDetectadas: 1,
    });

    return {
      score: puntajeGlobal, position, totalStudents,
      correctAnswers: totalCorrectas, incorrectAnswers: totalIncorrectas,
      totalAnswered:  totalCorrectas + totalIncorrectas,
      areas: areasDetalle,
    };
  }

  // ─── calcularBatch (grupal, Semi-IRT desde resultados_preguntas) ──────────
  async calcularBatch(
    idInstituto: string,
    idSimulacro: string | null,
    estudiantes: Array<{
      idEstudiante: string;
      subjects: Array<{ name: string; correctAnswers: number; incorrectAnswers: number }>;
    }>,
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

    // ── 2. Cargar pesos IRT de todas las preguntas involucradas ───────────────
    const idPreguntas = [...new Set(todasRespuestas.map((r: any) => r.idPregunta as string))];
    const objectIds   = idPreguntas
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const contadores = await this.db
      .collection('contadores_preguntas')
      .find({ _id: { $in: objectIds } })
      .toArray();

    const contadorMap = new Map<string, ContadorPregunta>();
    for (const c of contadores) contadorMap.set(c._id.toString(), c as unknown as ContadorPregunta);

    // ── 3. Agrupar respuestas por estudiante ───
    const respuestasPorEstudiante = new Map<
      string,
      Array<{ asignatura: string; respuesta: boolean; idPregunta: string }>
    >();

    for (const r of todasRespuestas as any[]) {
      const id = r.idEstudiante as string;
      if (!respuestasPorEstudiante.has(id)) respuestasPorEstudiante.set(id, []);
      respuestasPorEstudiante.get(id)!.push({
        asignatura: r.asignatura,
        respuesta:  r.respuesta,
        idPregunta: r.idPregunta,
      });
    }

    // ── 4. Calcular puntaje por estudiante ────
    const puntajes: Array<{
      idEstudiante: string; score: number;
      correctAnswers: number; incorrectAnswers: number; areas: PuntajeArea[];
    }> = [];

    for (const est of estudiantes) {
      const respuestas = respuestasPorEstudiante.get(est.idEstudiante);

      if (respuestas && respuestas.length > 0) {
        const { areaNormalizada, areasDetalle } = calcularIRTDesdeRespuestas(respuestas, contadorMap);
        puntajes.push({
          idEstudiante:    est.idEstudiante,
          score:           calcularPuntajeSaber11(areaNormalizada),
          correctAnswers:  areasDetalle.reduce((s, a) => s + a.correctas, 0),
          incorrectAnswers: areasDetalle.reduce((s, a) => s + a.incorrectas, 0),
          areas:           areasDetalle,
        });
      } else {
        console.warn(`[SemiIRT] Fallback subjects para estudiante=${est.idEstudiante} — sin respuestas en BD`);
        const { areaNormalizada, areasDetalle, totalCorrectas, totalIncorrectas } =
          calcularDesdeSubjectsFallback(est.subjects);

        puntajes.push({
          idEstudiante:     est.idEstudiante,
          score:            calcularPuntajeSaber11(areaNormalizada),
          correctAnswers:   totalCorrectas,
          incorrectAnswers: totalIncorrectas,
          areas:            areasDetalle,
        });
      }
    }

    // ── 5. Posiciones relativas dentro del grupo ────
    const scoresOrdenados = [...puntajes].sort((a, b) => b.score - a.score);
    const totalStudents   = puntajes.length;
    const ahora           = new Date();

    // ── 6. Construir respuesta + bulk writes ───
    const resultados: Record<string, any> = {};
    const bulkStudents:    any[] = [];
    const bulkEstudiantes: any[] = [];

    for (const p of puntajes) {
      const position = scoresOrdenados.findIndex(s => s.idEstudiante === p.idEstudiante) + 1;

      resultados[p.idEstudiante] = {
        score:            p.score,
        position,
        totalStudents,
        correctAnswers:   p.correctAnswers,
        incorrectAnswers: p.incorrectAnswers,
        totalAnswered:    p.correctAnswers + p.incorrectAnswers,
        areas:            p.areas,
      };

      bulkStudents.push({
        updateOne: {
          filter: { id_estudiante: p.idEstudiante },
          update: { $set: { scoreSimulacro: p.score, lastCalculo: ahora, areasSimulacro: p.areas } },
        },
      });

      bulkEstudiantes.push({
        updateOne: {
          filter: { id_student: p.idEstudiante },
          update: { $set: { scoreSimulacro: p.score, lastCalculo: ahora } },
        },
      });
    }

    await Promise.all([
      this.db.collection('students').bulkWrite(bulkStudents,    { ordered: false }),
      this.db.collection('Estudiantes').bulkWrite(bulkEstudiantes, { ordered: false }),
    ]);

    return resultados;
  }

  // ─── calcularPosicion ───
  private async calcularPosicion(
    idEstudiante: string,
    idInstituto: string,
    puntajeGlobal: number,
  ): Promise<{ position: number; totalStudents: number }> {
    const studentsConScore = await this.db.collection('students')
      .find(
        { institute_id: idInstituto, scoreSimulacro: { $exists: true, $gt: 0 } },
        { projection: { id_estudiante: 1, scoreSimulacro: 1 } },
      ).toArray();

    const estudiantesConScore = await this.db.collection('Estudiantes')
      .find(
        { idInstituto, scoreSimulacro: { $exists: true, $gt: 0 } },
        { projection: { id_student: 1, scoreSimulacro: 1 } },
      ).toArray();

    const scores = new Map<string, number>();
    for (const s of studentsConScore)  scores.set(s.id_estudiante, s.scoreSimulacro);
    for (const s of estudiantesConScore) scores.set(s.id_student, s.scoreSimulacro);
    scores.set(idEstudiante, puntajeGlobal);

    const todosLosScores = Array.from(scores.values()).sort((a, b) => b - a);
    const position       = todosLosScores.indexOf(puntajeGlobal) + 1;

    return { position, totalStudents: scores.size };
  }

  private async guardarEnEstudiante(resultado: ResultadoSemiIRT): Promise<void> {
    const { idEstudiante, puntajeGlobal, fechaCalculo, areas } = resultado;

    const enStudents = await this.db.collection('students').updateOne(
      { id_estudiante: idEstudiante },
      { $set: { scoreSimulacro: puntajeGlobal, lastCalculo: fechaCalculo, areasSimulacro: areas } },
    );

    if (enStudents.matchedCount === 0) {
      await this.db.collection('Estudiantes').updateOne(
        { id_student: idEstudiante },
        { $set: { scoreSimulacro: puntajeGlobal, lastCalculo: fechaCalculo } },
      );
    }
  }
}