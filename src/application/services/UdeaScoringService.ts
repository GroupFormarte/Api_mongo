import mongoose from "mongoose";
import { AreaUdea, PuntajeAreaUdea, ResultadoGrupoUdea, ResultadoUdea, StudentFromFlutter } from "../../domain/interfaces/udeaInterfaces";


function mapAreaUdea(nombre: string): AreaUdea | null {
  const n = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (n.includes("razonamiento")) return "razonamiento";
  if (n.includes("lectora") || n.includes("lectura")) return "lectura";
  return null;
}

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
  async calcularGrupo ( students: StudentFromFlutter[], idSimulacro: string): Promise<ResultadoGrupoUdea> {
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

      const subjects = exam.subjects ?? [];
      if (!subjects.length) continue;

      const areasMap = new Map<
        AreaUdea,
        { nombre: string; correctas: number; total: number }
      >();

      for (const subject of subjects) {
        const areaKey = mapAreaUdea(subject.name ?? "");
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
    // Flutter envía presento=true/false basado en sessionResponses (igual que el cálculo local)
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
      if (presentadosIds.has(id)) {
        presentados.set(id, areas);
      } else {
        noPresentados.add(id);
      }
    }

    console.log(
      `[UdeA] Presentados: ${presentados.size} / ${porEstudiante.size}`,
    );

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
      console.log(
        `[UdeA] ${areaKey} → Media: ${est.media.toFixed(2)} | SD: ${est.sd.toFixed(2)}`,
      );
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

      for (const [areaKey, stats] of areas) {
        const est = estadisticas.get(areaKey) ?? { media: 0, sd: 1 };
        const puntaje = calcularPuntaje(stats.correctas, est.media, est.sd);

        //  LOG igual que Flutter
        console.log(
          `[UdeA] ${nombrePorId.get(idEstudiante) ?? idEstudiante} | ${stats.nombre}: aciertos=${stats.correctas} media=${est.media.toFixed(2)} sd=${est.sd.toFixed(2)} → P=${puntaje}`,
        );

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
      }

      const globalEstudiante =
        count > 0 ? parseFloat((suma / count).toFixed(1)) : 0;
      console.log(
        `[UdeA] ${nombrePorId.get(idEstudiante) ?? idEstudiante} → global: ${globalEstudiante}`,
      );

      resultados.push({
        idEstudiante,
        areas: areasDetalle,
        puntajeGlobal: globalEstudiante,
        position: 0, // se calcula abajo
        fechaCalculo,
      });
    }

    // No presentados → puntaje 0
    for (const idEstudiante of noPresentados) {
      resultados.push({
        idEstudiante,
        areas: [],
        puntajeGlobal: 0,
        position: 0,
        fechaCalculo,
      });
    }

    // 5. Calcular posición (ranking por puntajeGlobal desc)
    resultados.sort((a, b) => b.puntajeGlobal - a.puntajeGlobal);
    resultados.forEach((r, i) => {
      r.position = i + 1 ;
    });

    // Agregar nombres desde students (nombrePorId ya existe arriba)
    for (const r of resultados) {
      r.nombre = nombrePorId.get(r.idEstudiante) ?? `ID: ${r.idEstudiante}`;
    }

    // 6. Guardar en Estudiantes
    await this.guardarResultados(resultados);

    return { idSimulacro, resultados, fechaCalculo };
  }

  private async guardarResultados(resultados: ResultadoUdea[]): Promise<void> {
    if (resultados.length === 0) return;

    for (const r of resultados) {
      const enStudents = await this.db.collection("students").updateOne(
        { id_estudiante: r.idEstudiante },
        {
          $set: {
            scoreUdea: r.puntajeGlobal,
            positionUdea: r.position,
            lastCalculoUdea: r.fechaCalculo,
            areasUdea: r.areas,
          },
        },
      );
      // Solo si no existe en students, buscar en Estudiantes (legacy)
      if (enStudents.matchedCount === 0) {
        await this.db.collection("Estudiantes").updateOne(
          { id_student: r.idEstudiante },
          {
            $set: {
              scoreUdea: r.puntajeGlobal,
              positionUdea: r.position,
              lastCalculoUdea: r.fechaCalculo,
              areasUdea: r.areas,
            },
          },
        );
      }
    }

    console.log(`[UdeA] ✅ Guardados ${resultados.length} estudiantes`);
  }
}
