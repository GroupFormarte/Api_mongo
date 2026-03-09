import mongoose from 'mongoose';

// ─── Tipos ────────

interface ResultadoPregunta {
  idPregunta: string;
  asignatura: string;
  respuesta: boolean;
  dateCreated: string;
}

interface ContadorPregunta {
  _id: string;
  difficulty: number;
  weight: number;
  is_calibrated: boolean;
  total_answers: number;
}

export interface PuntajeArea {
  area: AreaSaber11;
  puntaje: number;       // 0–100
  correctas: number;
  incorrectas: number;
  total: number;
}

export interface ResultadoSemiIRT {
  idEstudiante: string;
  idInstituto: string;
  puntajeGlobal: number;   // 0–500
  areas: PuntajeArea[];
  fechaCalculo: Date;
  sesionesDetectadas: number;
}

type AreaSaber11 = 'lectura' | 'matematicas' | 'ciencias' | 'sociales' | 'ingles';

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

  const pesoReal = 1 - contador.difficulty;

  if (contador.total_answers < 200) {
    return parseFloat(((pesoReal + 0.5) / 2).toFixed(4));
  }

  return parseFloat(Math.min(0.9, Math.max(0.1, pesoReal)).toFixed(4));
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

  /**
   * Calcula el puntaje Saber 11 Semi-IRT de un estudiante.
   *
   * Flujo:
   * 1. Lee respuestas del estudiante en resultados_preguntas
   * 2. Detecta sesiones por fecha (mismo día = mismo simulacro)
   * 3. Usa la sesión más reciente por defecto
   * 4. Cruza con contadores_preguntas para pesos Semi-IRT
   * 5. Agrupa por área usando asignatura
   * 6. Normaliza puntaje por área a 0–100
   * 7. Aplica fórmula oficial Saber 11 → 0–500
   * 8. Guarda en Estudiantes
   */
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

    // 7. Puntaje global con fórmula oficial Saber 11
    const puntajeGlobal = calcularPuntajeSaber11(areaNormalizada);

    const resultado: ResultadoSemiIRT = {
      idEstudiante,
      idInstituto,
      puntajeGlobal,
      areas: areasDetalle,
      fechaCalculo: new Date(),
      sesionesDetectadas: sesiones.size,
    };

    // 8. Persistir en Estudiantes
    await this.guardarEnEstudiante(resultado);

    return resultado;
  }

  /**
   * Guarda puntajeGlobal en Estudiantes.grados[].scoreSimulacro
   * y puntaje por área en Estudiantes.grados[].asignaturas[].score
   */
  private async guardarEnEstudiante(resultado: ResultadoSemiIRT): Promise<void> {
    const { idEstudiante, puntajeGlobal, fechaCalculo, areas } = resultado;

    // Actualizar scoreSimulacro en todos los grados del estudiante
    await this.db.collection('Estudiantes').updateOne(
      { id_student: idEstudiante },
      {
        $set: {
          scoreSimulacro: puntajeGlobal,
          lastCalculo: fechaCalculo,
        }
      }
    );

    // Puntaje por área
    for (const area of areas) {
      await this.db.collection('Estudiantes').updateOne(
        {
          id_student: idEstudiante,
          'asignaturas.asignatura': area.area,
        },
        {
          $set: { 'asignaturas.$[a].score': area.puntaje }
        },
        {
          arrayFilters: [{ 'a.asignatura': area.area }]
        }
      );
    }
  }
}