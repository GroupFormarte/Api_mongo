import mongoose from "mongoose";
import {
  AreaUdea,
  PuntajeAreaUdea,
  ResultadoGrupoUdea,
  ResultadoUdea,
  StudentFromFlutter,
} from "../../domain/interfaces/udeaInterfaces";
import { mapAsignaturaToAreaUdea } from "./mappers/udeaSubjectMapper";
import { buildExamAssignmentUpdate, udeaAreaNameMap } from "./helpers/examAssignmentUpdate";

/**
 * SD poblacional ÷N — el grupo ES la población completa.
 */
function calcularEstadisticas(aciertos: number[]): {
  media: number;
  sd: number;
} {
  const n = aciertos.length;
  if (n === 0) return { media: 0, sd: 1 };
  const media = aciertos.reduce((s, a) => s + a, 0) / n;
  if (n === 1) return { media, sd: 1 };
  const varianza = aciertos.reduce((s, a) => s + Math.pow(a - media, 2), 0) / n;
  const sd = Math.sqrt(varianza);
  return { media, sd: sd === 0 ? 1 : sd };
}

function calcularPuntaje(aciertos: number, media: number, sd: number): number {
  return parseFloat(
    Math.min(100, Math.max(0, 50 + 10 * ((aciertos - media) / sd))).toFixed(1),
  );
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export class UdeaScoringService {
  private db: mongoose.mongo.Db;

  constructor(db: mongoose.mongo.Db) {
    this.db = db;
  }

  /**
   * Calcula puntajes UdeA a partir de los estudiantes que manda Flutter.
   *
   * Flutter ya hizo el trabajo duro: procesó respuestas y calculó subjects
   * (aciertos por área por estudiante). El backend solo aplica la fórmula
   * estadística grupal y guarda en Estudiantes.
   *
   * Flujo:
   * 1. Extraer aciertos por área de cada estudiante (desde subjects)
   * 2. Separar presentados / no presentados
   * 3. Calcular media y SD poblacional — solo presentados
   * 4. Aplicar fórmula P = 50 + 10*(X-μ)/σ
   * 5. Calcular posición (ranking)
   * 6. Guardar en colección Estudiantes
   */
  async calcularGrupo(
    students: StudentFromFlutter[],
    idSimulacro: string,
  ): Promise<ResultadoGrupoUdea> {
    // 1. Extraer aciertos por área de cada estudiante
    // Map: idEstudiante → Map<areaKey, { nombre, correctas, total }>
    const porEstudiante = new Map<
      string,
      Map<AreaUdea, { nombre: string; correctas: number; total: number }>
    >();

    for (const student of students) {
      const id = student.id ?? student.id_estudiante ?? student.studentId;
      if (!id) continue;

      // Buscar el examen del simulacro correcto
      const exams = student.examenes_asignados ?? student.assignedExams ?? [];
      const exam = exams.find((e) => e.idSimulacro === idSimulacro);
      if (!exam) continue;

      const subjects = exam.subjects ?? exam.materias ?? [];
      if (!subjects.length) continue;

      const areasMap = new Map<
        AreaUdea,
        { nombre: string; correctas: number; total: number }
      >();

      for (const subject of subjects) {
        const areaKey = mapAsignaturaToAreaUdea(subject.name ?? "");

        if (!areaKey) continue;

        const existing = areasMap.get(areaKey);
        if (existing) {
          // Si hay dos subjects del mismo área, acumular
          existing.correctas += subject.correctAnswers ?? 0;
          existing.total += (subject.correctAnswers ?? 0) + (subject.incorrectAnswers ?? 0);
        } else {
          areasMap.set(areaKey, {
            nombre: subject.name ?? "",
            correctas: subject.correctAnswers ?? 0,
            total:
              (subject.correctAnswers ?? 0) + (subject.incorrectAnswers ?? 0),
          });
        }
      }

      if (areasMap.size > 0) {
        porEstudiante.set(id, areasMap);
      }
    }

    // 2. Separar presentados / no presentados
    // Para UdeA, si ya hay respuestas acumuladas por área (>0), cuenta como presentado
    // aunque `presento` venga false.
    const presentadosIds = new Set<string>(
      students
        .filter((s) => s.presento === true)
        .map((s) => s.id ?? s.id_estudiante ?? s.studentId ?? "")
        .filter(Boolean),
    );

    const presentados = new Map<
      string,
      Map<AreaUdea, { nombre: string; correctas: number; total: number }>
    >();
    const noPresentados = new Set<string>();

    for (const [id, areas] of porEstudiante) {
      const totalRespondido = [...areas.values()].reduce(
        (s, a) => s + a.total,
        0,
      );

      if (presentadosIds.has(id) || totalRespondido > 0) {
        presentados.set(id, areas);
      } else {
        noPresentados.add(id);
      }
    }

    // 3. Media y SD poblacional por área — solo presentados
    const aciertosPorArea = new Map<AreaUdea, number[]>();
    for (const [, areas] of presentados) {
      for (const [areaKey, stats] of areas) {
        if (!aciertosPorArea.has(areaKey)) aciertosPorArea.set(areaKey, []);
        aciertosPorArea.get(areaKey)!.push(stats.correctas);
      }
    }

    const estadisticas = new Map<AreaUdea, { media: number; sd: number }>();
    for (const [areaKey, aciertos] of aciertosPorArea) {
      const est = calcularEstadisticas(aciertos);
      estadisticas.set(areaKey, est);
    }

    // 4. Aplicar fórmula
    const fechaCalculo = new Date();
    const resultados: ResultadoUdea[] = [];

    // Mapa de nombres — necesario para los logs
    const nombrePorId = new Map<string, string>();
    for (const s of students) {
      const id = s.id ?? s.id_estudiante ?? s.studentId;
      if (id && s.name) nombrePorId.set(id, s.name);
    }

    // Presentados
    for (const [idEstudiante, areas] of presentados) {
      const areasDetalle: PuntajeAreaUdea[] = [];
      let suma = 0;
      let count = 0;
      let totalAnswered = 0;
      let totalCorrectas = 0;

      for (const [areaKey, stats] of areas) {
        const est = estadisticas.get(areaKey) ?? { media: 0, sd: 1 };
        const puntaje = calcularPuntaje(stats.correctas, est.media, est.sd);

        areasDetalle.push({
          area: stats.nombre,
          puntaje,
          correctas: stats.correctas,
          incorrectas: stats.total - stats.correctas,
          total: stats.total,
          media: parseFloat(est.media.toFixed(2)),
          sd: parseFloat(est.sd.toFixed(2)),
        });

        suma += puntaje;
        count++;
        totalAnswered += stats.total;
        totalCorrectas += stats.correctas;
      }

      const sinAciertos = totalAnswered === 0 || totalCorrectas === 0;
      const areasFinales = sinAciertos
        ? areasDetalle.map((a) => ({ ...a, puntaje: 0 }))
        : areasDetalle;
      const globalCalculado =
        count > 0 ? parseFloat((suma / count).toFixed(1)) : 0;
      const globalEstudiante = sinAciertos ? 0 : globalCalculado;

      resultados.push({
        idEstudiante,
        areas: areasFinales,
        puntajeGlobal: globalEstudiante,
        position: 0, // se calcula abajo
        totalAnswered,
        fechaCalculo,
      });
    }

    // No presentados → puntaje 0
    const areasVacias: PuntajeAreaUdea[] = (
      ["Razonamiento Lógico", "Competencia Lectora"] as AreaUdea[]
    ).map((area) => ({
      area,
      puntaje: 0,
      correctas: 0,
      incorrectas: 0,
      total: 0,
      media: 0,
      sd: 0,
    }));

    for (const idEstudiante of noPresentados) {
      resultados.push({
        idEstudiante,
        areas: areasVacias,
        puntajeGlobal: 0,
        position: 0,
        totalAnswered: 0,
        fechaCalculo,
      });
    }

    // 5. Calcular posición (ranking por puntajeGlobal desc)
    resultados.sort((a, b) => b.puntajeGlobal - a.puntajeGlobal);
    resultados.forEach((r, i) => {
      r.position = i + 1;
    });

    // Agregar nombres desde students (nombrePorId ya existe arriba)
    for (const r of resultados) {
      r.nombre = nombrePorId.get(r.idEstudiante) ?? `ID: ${r.idEstudiante}`;
    }

    const bulkStudents: any[] = [];
    const bulkEstudiantes: any[] = [];

    for (const resultado of resultados) {
      const { $set, arrayFilters } = buildExamAssignmentUpdate(
        resultado.puntajeGlobal,
        resultado.areas,
        idSimulacro,
        udeaAreaNameMap,
      );

      bulkStudents.push({
        updateOne: {
          filter: { id_estudiante: resultado.idEstudiante },
          update: { $set },
          arrayFilters,
        },
      });

      bulkEstudiantes.push({
        updateOne: {
          filter: { id_student: resultado.idEstudiante },
          update: { $set },
          arrayFilters,
        },
      });
    }

    await Promise.all([
      this.db.collection("students").bulkWrite(bulkStudents, { ordered: false }),
      this.db.collection("Estudiantes").bulkWrite(bulkEstudiantes, { ordered: false }),
    ]);

    return { idSimulacro, resultados, fechaCalculo };
  }
}
