import mongoose from 'mongoose';
import { AreaUnal, PuntajeAreaUnal, ResultadoUnal } from '../../domain/interfaces/unalInterface';

function mapAsignaturaToAreaUnal(asignatura: string): AreaUnal | null {
  const a = asignatura
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (a.includes('matematica') || a.includes('razonamiento logico') ||
      a.includes('razonamiento matematico')) return 'matematicas';

  if (a.includes('ciencias naturales') || a.includes('biologia') ||
      a.includes('fisica') || a.includes('quimica')) return 'ciencias';

  if (a.includes('ciencias sociales') || a.includes('competencia ciudadana') ||
      a.includes('sociales')) return 'sociales';

  if (a.includes('lectura') || a.includes('competencia lectora') ||
      a.includes('analisis textual') || a.includes('analisis de texto')) return 'lectura';

  if (a.includes('ingles') || a.includes('english')) return 'ingles';

  return null;
}

// ─── Estadísticas del grupo ───────────────────────────────────────────────────

function calcularEstadisticas(valores: number[]): { media: number; sd: number } {
  if (valores.length === 0) return { media: 0, sd: 1 };

  const media = valores.reduce((s, v) => s + v, 0) / valores.length;

  if (valores.length === 1) return { media, sd: 1 };

  const varianza = valores.reduce((s, v) => s + Math.pow(v - media, 2), 0) / (valores.length - 1);
  const sd = Math.sqrt(varianza);

  return { media, sd: sd < 0.001 ? 1 : sd };
}

/**
 * Convierte % de aciertos en área a puntaje UNAL (0–15).
 * Escala: media=10, SD=2 (coherente con históricos UNAL)
 * Fórmula: 10 + 2 × (pctEstudiante − mediaGrupo) / sdGrupo
 */
function calcularPuntajeArea(
  pctEstudiante: number,
  mediaGrupo: number,
  sdGrupo: number,
): number {
  const puntaje = 10 + 2 * ((pctEstudiante - mediaGrupo) / sdGrupo);
  return parseFloat(Math.min(15, Math.max(0, puntaje)).toFixed(2));
}

/**
 * Convierte puntajes de área (0–15) a puntaje global UNAL (0–1000).
 * Escala: media=500, SD=100
 * Pesos: matemáticas y lectura tienen mayor peso en UNAL.
 */
function calcularPuntajeGlobal(
  areas: PuntajeAreaUnal[],
  mediaGlobalGrupo: number,
  sdGlobalGrupo: number,
  promedioAreasPonderado: number,
): number {
  const puntaje = 500 + 100 * ((promedioAreasPonderado - mediaGlobalGrupo) / sdGlobalGrupo);
  return parseFloat(Math.min(1000, Math.max(0, puntaje)).toFixed(1));
}

/**
 * Promedio simple de áreas — UNAL trata todas las áreas con igual importancia.
 * Inglés se incluye si está presente (informativo pero cuenta).
 */
function promedioAreasSimple(areas: PuntajeAreaUnal[]): number {
  if (areas.length === 0) return 0;
  const suma = areas.reduce((s, a) => s + a.puntaje, 0);
  return suma / areas.length;
}

// ─── Servicio principal ───────────────────────────────────────────────────────

export class UnalScoringService {
  private db: mongoose.mongo.Db;

  constructor(db: mongoose.mongo.Db) {
    this.db = db;
  }

  /**
   * Calcula puntaje UNAL para todos los estudiantes del grupo en batch.
   *
   * Flujo:
   * 1. Calcular % de aciertos por área para cada estudiante
   * 2. Calcular media y SD del grupo por área
   * 3. Convertir a puntaje de área 0–15 (z-score con media=10, SD=2)
   * 4. Calcular promedio ponderado de áreas
   * 5. Estandarizar promedio ponderado → escala 0–1000 (media=500, SD=100)
   * 6. Calcular posiciones
   * 7. Guardar en MongoDB
   */
  async calcularBatch(
    idInstituto: string,
    idSimulacro: string | null,
    estudiantes: Array<{
      idEstudiante: string;
      subjects: Array<{ name: string; correctAnswers: number; incorrectAnswers: number }>;
    }>,
  ): Promise<Record<string, ResultadoUnal>> {

    // ── Paso 1: % de aciertos por estudiante × área ─────────────────────────
    const datosEstudiantes: Array<{
      idEstudiante: string;
      porArea: Map<AreaUnal, { pct: number; correctas: number; incorrectas: number; total: number }>;
      correctasTotal: number;
      incorrectasTotal: number;
    }> = [];

    for (const est of estudiantes) {
      const porArea = new Map<AreaUnal, { pct: number; correctas: number; incorrectas: number; total: number }>();
      let correctasTotal = 0;
      let incorrectasTotal = 0;

      for (const subject of est.subjects) {
        const area = mapAsignaturaToAreaUnal(subject.name);
        if (!area) continue;

        const c = subject.correctAnswers ?? 0;
        const i = subject.incorrectAnswers ?? 0;
        const total = c + i;
        if (total === 0) continue;

        porArea.set(area, {
          pct: (c / total) * 100,
          correctas: c,
          incorrectas: i,
          total,
        });
        correctasTotal += c;
        incorrectasTotal += i;
      }

      datosEstudiantes.push({ idEstudiante: est.idEstudiante, porArea, correctasTotal, incorrectasTotal });
    }

    // ── Paso 2: Media y SD del grupo por área ────────────────────────────────
    const pctsPorArea = new Map<AreaUnal, number[]>();
    for (const est of datosEstudiantes) {
      for (const [area, datos] of est.porArea) {
        if (!pctsPorArea.has(area)) pctsPorArea.set(area, []);
        pctsPorArea.get(area)!.push(datos.pct);
      }
    }

    const estadisticasPorArea = new Map<AreaUnal, { media: number; sd: number }>();
    for (const [area, pcts] of pctsPorArea) {
      estadisticasPorArea.set(area, calcularEstadisticas(pcts));
    }

    // ── Paso 3 & 4: Puntaje por área (0–15) y promedio ponderado ─────────────
    const resultadosPrevios: Array<{
      idEstudiante: string;
      areas: PuntajeAreaUnal[];
      promedioPonderado: number;
      correctasTotal: number;
      incorrectasTotal: number;
    }> = [];

    for (const est of datosEstudiantes) {
      const areasDetalle: PuntajeAreaUnal[] = [];

      for (const [area, datos] of est.porArea) {
        const est2 = estadisticasPorArea.get(area) ?? { media: 50, sd: 1 };
        const puntajeArea = calcularPuntajeArea(datos.pct, est2.media, est2.sd);

        areasDetalle.push({
          area,
          puntaje: puntajeArea,
          correctas: datos.correctas,
          incorrectas: datos.incorrectas,
          total: datos.total,
        });
      }

      resultadosPrevios.push({
        idEstudiante: est.idEstudiante,
        areas: areasDetalle,
        promedioPonderado: promedioAreasSimple(areasDetalle),
        correctasTotal: est.correctasTotal,
        incorrectasTotal: est.incorrectasTotal,
      });
    }

    // ── Paso 5: Estandarizar promedios → 0–1000 ──────────────────────────────
    // Factor 130 calibrado con ejemplos reales UNAL:
    // promedio 11.875 → ~682, promedio 13.875 → ~838
    // Media poblacional referencia ≈ 11, SD referencia ≈ 1.5
    // Pero usamos la del grupo para que sea relativa al simulacro
    const promediosPonderados = resultadosPrevios.map(r => r.promedioPonderado);
    const { media: mediaGlobal, sd: sdGlobal } = calcularEstadisticas(promediosPonderados);

    // ── Paso 6: Calcular puntajes finales y posiciones ───────────────────────
    const puntajesFinales: Array<{ idEstudiante: string; score: number }> = [];

    for (const r of resultadosPrevios) {
      // UNAL: factor 130 calibrado con históricos reales (no 100 como Saber11)
      const score = 500 + 130 * ((r.promedioPonderado - mediaGlobal) / sdGlobal);
      puntajesFinales.push({
        idEstudiante: r.idEstudiante,
        score: parseFloat(Math.min(1000, Math.max(0, score)).toFixed(1)),
      });
    }

    const scoresOrdenados = [...puntajesFinales].sort((a, b) => b.score - a.score);
    const totalStudents = puntajesFinales.length;
    const ahora = new Date();

    // ── Paso 7: Construir respuesta y bulk write ──────────────────────────────
    const resultados: Record<string, ResultadoUnal> = {};
    const bulkStudents: any[] = [];
    const bulkEstudiantes: any[] = [];

    for (const pf of puntajesFinales) {
      const datos = resultadosPrevios.find(r => r.idEstudiante === pf.idEstudiante)!;
      const position = scoresOrdenados.findIndex(s => s.idEstudiante === pf.idEstudiante) + 1;

      resultados[pf.idEstudiante] = {
        idEstudiante: pf.idEstudiante,
        score: pf.score,
        position,
        totalStudents,
        correctAnswers: datos.correctasTotal,
        incorrectAnswers: datos.incorrectasTotal,
        totalAnswered: datos.correctasTotal + datos.incorrectasTotal,
        areas: datos.areas,
      };

      bulkStudents.push({
        updateOne: {
          filter: { id_estudiante: pf.idEstudiante },
          update: {
            $set: {
              scoreUnal: pf.score,
              lastCalculoUnal: ahora,
              areasUnal: datos.areas,
            }
          },
        }
      });

      bulkEstudiantes.push({
        updateOne: {
          filter: { id_student: pf.idEstudiante },
          update: {
            $set: {
              scoreUnal: pf.score,
              lastCalculoUnal: ahora,
            }
          },
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