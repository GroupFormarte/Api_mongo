import mongoose from 'mongoose';
import { AreaUnal, ResultadoUnal, PuntajeAreaUnal } from '../../domain/interfaces/unalInterface';
import { mapAsignaturaToAreaUnal } from './mappers/unalSubjectMapper';
import { buildExamAssignmentUpdate, unalAreaNameMap } from './helpers/examAssignmentUpdate';


function calcularEstadisticas(valores: number[]): { media: number; sd: number } {
  if (valores.length === 0) return { media: 0, sd: 1 };
  const media = valores.reduce((s, v) => s + v, 0) / valores.length;
  if (valores.length === 1) return { media, sd: 1 };
  const varianza = valores.reduce((s, v) => s + Math.pow(v - media, 2), 0) / (valores.length - 1);
  const sd = Math.sqrt(varianza);
  return { media, sd: sd < 0.001 ? 1 : sd };
}

function calcularScoreBruto(correctas: number, incorrectas: number): number {
  return Math.max(0, correctas - (incorrectas / 3));
}

/**
 * Etapa 2 — Habilidad por área (0–15), simulando IRT.
 * Fórmula: 10 + 2 × z  donde z = (scoreBruto_est − media_grupo) / sd_grupo
 * Media=10, SD=2 coherentes con históricos reales UNAL.
 */
function calcularPuntajeArea(scoreBruto: number, mediaGrupo: number, sdGrupo: number): number {
  const puntaje = 10 + 2 * ((scoreBruto - mediaGrupo) / sdGrupo);
  return parseFloat(Math.min(15, Math.max(0, puntaje)).toFixed(2));
}

/**
 * Etapa 3 — Puntaje global 0–1000.
 * UNAL usa igual importancia entre áreas (fuente oficial).
 * z-score del promedio simple de áreas → 500 ± 130.
 *
 * Factor 130 calibrado con ejemplos reales UNAL:
 *   Ejemplo 1: áreas ~11.9 promedio → global ~682
 *   Ejemplo 2: áreas ~13.9 promedio → global ~838
 */
function calcularPuntajeGlobal(promedioAreas: number, mediaGrupo: number, sdGrupo: number): number {
  const puntaje = 500 + 130 * ((promedioAreas - mediaGrupo) / sdGrupo);
  return parseFloat(Math.min(1000, Math.max(0, puntaje)).toFixed(1));
}

export class UnalScoringService {
  private db: mongoose.mongo.Db;

  constructor(db: mongoose.mongo.Db) {
    this.db = db;
  }

  /**
   * Calcula puntaje UNAL para todos los estudiantes del grupo en batch.
   *
   * Flujo (3 etapas oficiales UNAL simuladas):
   * 1. score_bruto = correctas - (incorrectas / 3)        ← penalización oficial
   * 2. puntaje_area (0-15) = z-score del grupo × 2 + 10   ← IRT simulado
   * 3. global (0-1000) = z-score del promedio SIMPLE × 130 + 500  ← igual importancia
   */
  async calcularBatch(
    idInstituto: string,
    idSimulacro: string | null,
    estudiantes: Array<{
      idEstudiante: string;
      subjects: Array<{ name: string; correctAnswers: number; incorrectAnswers: number }>;
    }>,
  ): Promise<Record<string, ResultadoUnal>> {

    // ── Paso 1: score_bruto por área por estudiante ──────────────────────────
    const datosEstudiantes: Array<{
      idEstudiante: string;
      porArea: Map<AreaUnal, { scoreBruto: number; correctas: number; incorrectas: number; total: number }>;
      correctasTotal: number;
      incorrectasTotal: number;
    }> = [];

    for (const est of estudiantes) {
      const porArea = new Map<AreaUnal, { scoreBruto: number; correctas: number; incorrectas: number; total: number }>();
      let correctasTotal = 0;
      let incorrectasTotal = 0;

      for (const subject of est.subjects) {

        const area = mapAsignaturaToAreaUnal(subject.name);
        if (!area) continue;

        const c = subject.correctAnswers ?? 0;
        const i = subject.incorrectAnswers ?? 0;
        const total = c + i;
        if (total === 0) continue;

        porArea.set(area, { scoreBruto: calcularScoreBruto(c, i), correctas: c, incorrectas: i, total });
        correctasTotal += c;
        incorrectasTotal += i;
      }

      datosEstudiantes.push({ idEstudiante: est.idEstudiante, porArea, correctasTotal, incorrectasTotal });

    }

    // ── Paso 2: Media y SD del grupo por área (sobre scoreBruto) ─────────────
    const brutosPorArea = new Map<AreaUnal, number[]>();
    for (const est of datosEstudiantes) {
      for (const [area, datos] of est.porArea) {
        if (!brutosPorArea.has(area)) brutosPorArea.set(area, []);
        brutosPorArea.get(area)!.push(datos.scoreBruto);
      }
    }

    const estadisticasPorArea = new Map<AreaUnal, { media: number; sd: number }>();
    for (const [area, brutos] of brutosPorArea) {
      estadisticasPorArea.set(area, calcularEstadisticas(brutos));
    }

    // ── Paso 3: Puntaje por área (0–15) y promedio simple ────────────────────
    const resultadosPrevios: Array<{
      idEstudiante: string;
      areas: PuntajeAreaUnal[];
      promedioAreas: number;
      correctasTotal: number;
      incorrectasTotal: number;
    }> = [];

    for (const est of datosEstudiantes) {
      const areasDetalle: PuntajeAreaUnal[] = [];

      for (const [area, datos] of est.porArea) {
        const { media, sd } = estadisticasPorArea.get(area) ?? { media: 0, sd: 1 };
        areasDetalle.push({
          area,
          puntaje: calcularPuntajeArea(datos.scoreBruto, media, sd),
          scoreBruto: parseFloat(datos.scoreBruto.toFixed(2)),
          correctas: datos.correctas,
          incorrectas: datos.incorrectas,
          total: datos.total,
        });
      }

      // Promedio SIMPLE — igual importancia entre áreas (oficial UNAL)
      const promedioAreas = areasDetalle.length > 0
        ? areasDetalle.reduce((s, a) => s + a.puntaje, 0) / areasDetalle.length
        : 0;

      resultadosPrevios.push({
        idEstudiante: est.idEstudiante,
        areas: areasDetalle,
        promedioAreas,
        correctasTotal: est.correctasTotal,
        incorrectasTotal: est.incorrectasTotal,
      });
    }

    // ── Paso 4: Estandarizar promedio simple → escala 0–1000 ─────────────────
    // Excluir estudiantes sin respuestas del cálculo estadístico
    const promedios = resultadosPrevios
      .filter(r => r.correctasTotal > 0 || r.incorrectasTotal > 0)
      .map(r => r.promedioAreas);
    const { media: mediaGlobal, sd: sdGlobal } = calcularEstadisticas(promedios);

    const puntajesFinales = resultadosPrevios.map(r => ({
      idEstudiante: r.idEstudiante,
      score: calcularPuntajeGlobal(r.promedioAreas, mediaGlobal, sdGlobal),
    }));

    const scoresOrdenados = [...puntajesFinales].sort((a, b) => b.score - a.score);
    const totalStudents = puntajesFinales.length;
    // ── Paso 5: Construir respuesta y guardar en MongoDB ─────────────────────
    const resultados: Record<string, ResultadoUnal> = {};
    const bulkStudents: any[] = [];
    const bulkEstudiantes: any[] = [];

    for (const pf of puntajesFinales) {
      const datos = resultadosPrevios.find(r => r.idEstudiante === pf.idEstudiante)!;
      const position = scoresOrdenados.findIndex(s => s.idEstudiante === pf.idEstudiante) + 1;
      const sinRespuestas = datos.correctasTotal === 0;

      const scoreFinal = sinRespuestas ? 0 : pf.score;
      const areasFinal = sinRespuestas
        ? datos.areas.map(a => ({ ...a, puntaje: 0 }))
        : datos.areas;

      resultados[pf.idEstudiante] = {
        idEstudiante: pf.idEstudiante,
        score: scoreFinal,
        position,
        totalStudents,
        correctAnswers: datos.correctasTotal,
        incorrectAnswers: datos.incorrectasTotal,
        totalAnswered: datos.correctasTotal + datos.incorrectasTotal,
        areas: areasFinal,
      };

      const { $set, arrayFilters } = buildExamAssignmentUpdate(
        scoreFinal,
        areasFinal,
        idSimulacro,
        unalAreaNameMap,
      );

      bulkStudents.push({
        updateOne: {
          filter: { id_estudiante: pf.idEstudiante },
          update: {
            $set,
          },
          arrayFilters,
        }
      });

      bulkEstudiantes.push({
        updateOne: {
          filter: { id_student: pf.idEstudiante },
          update: {
            $set,
          },
          arrayFilters,
        }
      });
    }



    await Promise.all([
      this.db.collection('students').bulkWrite(bulkStudents, { ordered: false }),
      this.db.collection('Estudiantes').bulkWrite(bulkEstudiantes, { ordered: false }),
    ]);

    return resultados;
  }
}