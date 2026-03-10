import mongoose from 'mongoose';
import { AreaSaber11, ContadorPregunta, PuntajeArea, ResultadoPregunta, ResultadoSemiIRT } from '../../domain/interfaces/saberInterfaces';

function mapAsignaturaToArea(asignatura: string): AreaSaber11 | null {
  const a = asignatura
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (a.includes('lectura') || a.includes('competencia lectora') ||
    a.includes('analisis textual')) return 'lectura';

  if (a.includes('matematica') || a.includes('razonamiento logico')) return 'matematicas';

  if (a.includes('ciencias naturales') || a.includes('biologia') ||
    a.includes('fisica') || a.includes('quimica')) return 'ciencias';

  if (a.includes('ciencias sociales') || a.includes('competencia ciudadana'))
    return 'sociales';

  if (a.includes('ingles') || a.includes('english')) return 'ingles';

  return null;
}

// ─── Peso Semi-IRT ───
/**
 * Calcula el peso de una pregunta según sus datos históricos.
 * 
 * La ponderación se determina por el número total de respuestas y el nivel de dificultad:
 * - Si el contador no está definido o el total de respuestas es inferior a 100: devuelve 0,5. (sin datos suficientes)
 * - Si el total de respuestas es inferior a 200: devuelve la media de (1 - dificultad) y 0,5.
 * - En caso contrario: devuelve (1 - dificultad) limitado entre 0,1 y 0,9.
 */
function calcularPeso(contador: ContadorPregunta | undefined): number {
  if (!contador || contador.total_answers < 100) return 0.5;

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
  const lc = areas.get('lectura') ?? 0;
  const ma = areas.get('matematicas') ?? 0;
  const cn = areas.get('ciencias') ?? 0;
  const cs = areas.get('sociales') ?? 0;
  const ing = areas.get('ingles') ?? 0;

  const ig = (3 * lc + 3 * ma + 3 * cn + 3 * cs + ing) / 13;
  return parseFloat(Math.min(500, Math.max(0, ig * 5)).toFixed(1));
}

export class SemiIrtScoringService {
  private db: mongoose.mongo.Db;

  constructor(db: mongoose.mongo.Db) {
    this.db = db;
  }

  async calcular(
    idEstudiante: string,
    idInstituto: string,
    opciones: { soloUltimaSesion?: boolean } = { soloUltimaSesion: true }
  ): Promise<ResultadoSemiIRT> {

    // 1. Respuestas del estudiante — sin filtrar por idGrado
    // (las respuestas de un mismo simulacro pueden estar en distintos idGrado)
    const respuestas = await this.db
      .collection<ResultadoPregunta>('resultados_preguntas')
      .find({ idEstudiante, idInstituto })
      .toArray();

    if (respuestas.length === 0) {
      throw new Error(
        `Sin respuestas para estudiante=${idEstudiante} instituto=${idInstituto}`
      );
    }

    // 2. Agrupar por sesión (fecha YYYY-MM-DD)
    const sesiones = new Map<string, ResultadoPregunta[]>();
    for (const r of respuestas) {
      const fecha = r.dateCreated?.substring(0, 10) ?? 'sin-fecha';
      if (!sesiones.has(fecha)) sesiones.set(fecha, []);
      sesiones.get(fecha)!.push(r);
    }

    // 3. Seleccionar sesión más reciente o acumulado total
    let respuestasFiltradas: ResultadoPregunta[];
    if (opciones.soloUltimaSesion) {
      const fechaReciente = Array.from(sesiones.keys()).sort().at(-1)!;
      respuestasFiltradas = sesiones.get(fechaReciente)!;
    } else {
      respuestasFiltradas = respuestas;
    }

    // 4. Obtener pesos desde contadores_preguntas
    const idPreguntas = [...new Set(respuestasFiltradas.map(r => r.idPregunta))];
    const contadores = await this.db
      .collection<ContadorPregunta>('contadores_preguntas')
      .find({ _id: { $in: idPreguntas } })
      .toArray();

    const contadorMap = new Map<string, ContadorPregunta>();
    for (const c of contadores) {
      contadorMap.set(c._id.toString(), c);
    }

    // 5. Calcular puntaje Semi-IRT por área
    const areaPesoTotal = new Map<AreaSaber11, number>();
    const areaPesoCorrecto = new Map<AreaSaber11, number>();
    const areaStats = new Map<AreaSaber11, { correctas: number; incorrectas: number }>();

    for (const resp of respuestasFiltradas) {
      const area = mapAsignaturaToArea(resp.asignatura);
      if (!area) continue; // asignatura fuera del Saber 11

      const peso = calcularPeso(contadorMap.get(resp.idPregunta));

      areaPesoTotal.set(area, (areaPesoTotal.get(area) ?? 0) + peso);
      areaPesoCorrecto.set(area, (areaPesoCorrecto.get(area) ?? 0) + (resp.respuesta ? peso : 0));

      if (!areaStats.has(area)) areaStats.set(area, { correctas: 0, incorrectas: 0 });
      const stats = areaStats.get(area)!;
      resp.respuesta ? stats.correctas++ : stats.incorrectas++;
    }

    // 6. Normalizar a 0–100 por área
    const areaNormalizada = new Map<AreaSaber11, number>();
    const areasDetalle: PuntajeArea[] = [];

    for (const [area, pesoTotal] of areaPesoTotal.entries()) {
      const pesoCorrecto = areaPesoCorrecto.get(area) ?? 0;
      const puntaje = pesoTotal > 0
        ? parseFloat(((pesoCorrecto / pesoTotal) * 100).toFixed(1))
        : 0;

      areaNormalizada.set(area, puntaje);

      const stats = areaStats.get(area) ?? { correctas: 0, incorrectas: 0 };
      areasDetalle.push({
        area,
        puntaje,
        correctas: stats.correctas,
        incorrectas: stats.incorrectas,
        total: stats.correctas + stats.incorrectas,
      });
    }

    const puntajeGlobal = calcularPuntajeSaber11(areaNormalizada);

    const resultado: ResultadoSemiIRT = {
      idEstudiante,
      idInstituto,
      puntajeGlobal,
      areas: areasDetalle,
      fechaCalculo: new Date(),
      sesionesDetectadas: sesiones.size,
    };

    await this.guardarEnEstudiante(resultado);

    return resultado;
  }

  /**
 * Calcula puntaje Saber 11 recibiendo subjects directamente desde Flutter.
 * No depende de resultados_preguntas — Flutter ya tiene correctas/incorrectas.
 */
  async calcularDesdeSubjects(
    idEstudiante: string,
    idInstituto: string,
    idSimulacro: string | null,
    subjects: Array<{ name: string; correctAnswers: number; incorrectAnswers: number }>,
  ): Promise<{
    score: number;
    position: number;
    totalStudents: number;
    correctAnswers: number;
    incorrectAnswers: number;
    totalAnswered: number;
    areas: PuntajeArea[];
  }> {

    const areaNormalizada = new Map<AreaSaber11, number>();
    const areasDetalle: PuntajeArea[] = [];
    let totalCorrectas = 0;
    let totalIncorrectas = 0;

    for (const subject of subjects) {
      const area = mapAsignaturaToArea(subject.name);
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

    const { position, totalStudents } = await this.calcularPosicion(
      idEstudiante, idInstituto, puntajeGlobal,
    );

    const resultado: ResultadoSemiIRT = {
      idEstudiante,
      idInstituto,
      puntajeGlobal,
      areas: areasDetalle,
      fechaCalculo: new Date(),
      sesionesDetectadas: 1,
    };
    await this.guardarEnEstudiante(resultado);

    return {
      score: puntajeGlobal,
      position,
      totalStudents,
      correctAnswers: totalCorrectas,
      incorrectAnswers: totalIncorrectas,
      totalAnswered: totalCorrectas + totalIncorrectas,
      areas: areasDetalle,
    };
  }

  //Calcula la posición del estudiante comparando con scores del instituto.
  private async calcularPosicion(
    idEstudiante: string,
    idInstituto: string,
    puntajeGlobal: number,
  ): Promise<{ position: number; totalStudents: number }> {

    const studentsConScore = await this.db
      .collection('students')
      .find(
        { institute_id: idInstituto, scoreSimulacro: { $exists: true, $gt: 0 } },
        { projection: { id_estudiante: 1, scoreSimulacro: 1 } }
      ).toArray();

    const estudiantesConScore = await this.db
      .collection('Estudiantes')
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

  async calcularBatch(
    idInstituto: string,
    idSimulacro: string | null,
    estudiantes: Array<{
      idEstudiante: string;
      subjects: Array<{ name: string; correctAnswers: number; incorrectAnswers: number }>;
    }>,
  ): Promise<Record<string, {
    score: number;
    position: number;
    totalStudents: number;
    correctAnswers: number;
    incorrectAnswers: number;
    totalAnswered: number;
  }>> {

    // 1. Calcular puntaje global por estudiante
    const puntajes: Array<{
      idEstudiante: string;
      score: number;
      correctAnswers: number;
      incorrectAnswers: number;
      areas: PuntajeArea[];
    }> = [];

    for (const est of estudiantes) {
      const areaNormalizada = new Map<AreaSaber11, number>();
      const areasDetalle: PuntajeArea[] = [];
      let correctas = 0;
      let incorrectas = 0;

      for (const subject of est.subjects) {
        const area = mapAsignaturaToArea(subject.name);
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

    // 2. Calcular posiciones relativas dentro del grupo
    const scoresOrdenados = [...puntajes].sort((a, b) => b.score - a.score);
    const totalStudents = puntajes.length;
    const ahora = new Date();

    // 3. Preparar bulk writes y construir respuesta
    const bulkStudents: any[] = [];
    const bulkEstudiantes: any[] = [];
    const resultados: Record<string, any> = {};

    for (const p of puntajes) {
      const position = scoresOrdenados.findIndex(s => s.idEstudiante === p.idEstudiante) + 1;

      resultados[p.idEstudiante] = {
        score: p.score,
        position,
        totalStudents,
        correctAnswers: p.correctAnswers,
        incorrectAnswers: p.incorrectAnswers,
        totalAnswered: p.correctAnswers + p.incorrectAnswers,
      };

      // students (colección activa)
      bulkStudents.push({
        updateOne: {
          filter: { id_estudiante: p.idEstudiante },
          update: { $set: { scoreSimulacro: p.score, lastCalculo: ahora, areasSimulacro: p.areas } },
        }
      });

      // Estudiantes (legacy)
      bulkEstudiantes.push({
        updateOne: {
          filter: { id_student: p.idEstudiante },
          update: { $set: { scoreSimulacro: p.score, lastCalculo: ahora } },
        }
      });
    }

    // 4. Guardar en ambas colecciones en paralelo
    await Promise.all([
      this.db.collection('students').bulkWrite(bulkStudents, { ordered: false }),
      this.db.collection('Estudiantes').bulkWrite(bulkEstudiantes, { ordered: false }),
    ]);

    return resultados;
  }

  /** Guarda puntajeGlobal en Estudiantes.grados[].scoreSimulacro
   * y puntaje por área en Estudiantes.grados[].asignaturas[].score */
  private async guardarEnEstudiante(resultado: ResultadoSemiIRT): Promise<void> {
    const { idEstudiante, puntajeGlobal, fechaCalculo, areas } = resultado;

    const enStudents = await this.db.collection('students').updateOne(
      { id_estudiante: idEstudiante },
      {
        $set: {
          scoreSimulacro: puntajeGlobal,
          lastCalculo: fechaCalculo,
          areasSimulacro: areas,
        }
      }
    );
    if (enStudents.matchedCount === 0) {
      await this.db.collection('Estudiantes').updateOne(
        { id_student: idEstudiante },
        {
          $set: {
            scoreSimulacro: puntajeGlobal,
            lastCalculo: fechaCalculo,
          }
        }
      );
    }
  }

}