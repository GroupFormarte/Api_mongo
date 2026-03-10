import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { SemiIrtScoringService } from "../../../application/services/SemiIrtScoringService";
import { UdeaScoringService } from "../../../application/services/UdeaScoringService";

const router = Router();

function getDb(): mongoose.mongo.Db {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB no conectado");
  return db;
}


// ─── En scoring.router.ts ─────────────────────────────────────────────────────
// Reemplaza SOLO el handler de /udea/grupo/:idGrado/:idInstituto

/**
 * POST /api/scoring/udea/calcular
 *
 * Recibe los estudiantes con subjects ya calculados por Flutter
 * y aplica la fórmula estadística UdeA grupalmente.
 *
 * Body:
 * {
 *   idSimulacro: string,
 *   students: Student[]   ← studentsAux de Flutter (con assignedExams.subjects)
 * }
 */
router.post(
  "/udea/calcular",
  async (req: Request, res: Response) => {
    const { idSimulacro, students } = req.body;

     // LOG TEMPORAL
  console.log('[UdeA] idSimulacro:', idSimulacro);
  console.log('[UdeA] students recibidos:', students?.length);
  console.log('[UdeA] primer student keys:', students?.[0] ? Object.keys(students[0]) : 'ninguno');
  console.log('[UdeA] examenes del primer student:', JSON.stringify(students?.[0]?.examenes_asignados?.[0] || students?.[0]?.assignedExams?.[0], null, 2));

    if (!idSimulacro || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Se requieren: idSimulacro (string) y students (array)",
      });
    }

    try {
      const db = getDb();
      const service = new UdeaScoringService(db);
      const resultado = await service.calcularDesdeFlutter(students, idSimulacro);

      return res.status(200).json({
        ok: true,
        data: {
          idSimulacro,
          totalEstudiantes: resultado.resultados.length,
          presentados:      resultado.resultados.filter(r => r.areas.length > 0).length,
          noPresentados:    resultado.resultados.filter(r => r.areas.length === 0).length,
          fechaCalculo:     resultado.fechaCalculo,
          resultados:       resultado.resultados,
        },
      });
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido";
      return res.status(500).json({ ok: false, error: mensaje });
    }
  },
);

/**
 * POST /api/scoring/saber11/:idEstudiante/:idInstituto
 *
 * Calcula el puntaje Saber 11 Semi-IRT de un estudiante.
 * No filtra por idGrado porque las respuestas de un mismo
 * simulacro pueden estar distribuidas en distintos grados.
 *
 * Query params:
 *   soloUltimaSesion: 'true' | 'false'  (default: true)
 *
 * Ejemplo:
 *   POST /api/scoring/saber11/53/1
 */
router.post(
  "/saber11/:idEstudiante/:idInstituto",
  async (req: Request, res: Response) => {
    const { idEstudiante, idInstituto } = req.params;
    const soloUltimaSesion = req.query.soloUltimaSesion !== "false";

    try {
      const service = new SemiIrtScoringService(getDb());
      const resultado = await service.calcular(idEstudiante, idInstituto, {
        soloUltimaSesion,
      });

      return res.status(200).json({ ok: true, data: resultado });
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido";
      return res.status(500).json({ ok: false, error: mensaje });
    }
  },
);

/**
 * POST /api/scoring/saber11/instituto/:idInstituto
 *
 * Calcula el puntaje Saber 11 de TODOS los estudiantes
 * de un instituto. Útil al cerrar un simulacro.
 *
 * Ejemplo:
 *   POST /api/scoring/saber11/instituto/1
 */
router.post(
  "/saber11/instituto/:idInstituto",
  async (req: Request, res: Response) => {
    const { idInstituto } = req.params;

    try {
      const db = getDb();
      const service = new SemiIrtScoringService(db);

      const estudiantesUnicos = await db
        .collection("resultados_preguntas")
        .distinct("idEstudiante", { idInstituto });

      const resultados = [];
      const errores = [];

      for (const idEstudiante of estudiantesUnicos) {
        try {
          const r = await service.calcular(idEstudiante, idInstituto);
          resultados.push({
            idEstudiante,
            puntajeGlobal: r.puntajeGlobal,
            ok: true,
          });
        } catch (e) {
          errores.push({
            idEstudiante,
            error: e instanceof Error ? e.message : "Error",
            ok: false,
          });
        }
      }

      const actualizados = await recalibrarContadores(db);

      return res.status(200).json({
        ok: true,
        totalEstudiantes: estudiantesUnicos.length,
        calculados: resultados.length,
        errores: errores.length,
        contadoresActualizados: actualizados,
        resultados,
        erroresList: errores,
      });
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido";
      return res.status(500).json({ ok: false, error: mensaje });
    }
  },
);

/**
 * POST /api/scoring/recalibrar
 *
 * Recalcula difficulty y weight en contadores_preguntas
 * usando todos los datos actuales de resultados_preguntas.
 *
 * Llamar manualmente después de cada simulacro completado,
 * o programar como cron job.
 */
router.post("/recalibrar", async (_req: Request, res: Response) => {
  try {
    const actualizados = await recalibrarContadores(getDb());
    return res
      .status(200)
      .json({ ok: true, contadoresActualizados: actualizados });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return res.status(500).json({ ok: false, error: mensaje });
  }
});

/**
 * POST /api/scoring/cerrar-simulacro
 *
 * Cierra un simulacro Saber 11 de forma completa:
 * 1. Calcula puntaje Semi-IRT para todos los estudiantes del instituto
 * 2. Quita la asignación del simulacro a los estudiantes
 * 3. Recalibra los contadores de preguntas
 *
 * Body:
 * {
 *   idSimulacro:    string,   — ID del simulacro a cerrar
 *   idInstituto:    string,   — Instituto al que pertenece
 *   classroomId:    string,   — Aula/grupo del simulacro
 *   idsEstudiantes: string[], — Lista de IDs de estudiantes asignados
 * }
 */
router.post("/cerrar-simulacro", async (req: Request, res: Response) => {
  const { idSimulacro, idInstituto, classroomId, idsEstudiantes } = req.body;

  if (
    !idSimulacro ||
    !idInstituto ||
    !classroomId ||
    !Array.isArray(idsEstudiantes)
  ) {
    return res.status(400).json({
      ok: false,
      error:
        "Se requieren: idSimulacro, idInstituto, classroomId, idsEstudiantes[]",
    });
  }

  try {
    const db = getDb();
    const service = new SemiIrtScoringService(db);

    // ── 1. Calcular Semi-IRT para cada estudiante ──────────────────────────
    const scoring = { calculados: [] as any[], errores: [] as any[] };

    for (const idEstudiante of idsEstudiantes) {
      try {
        const r = await service.calcular(idEstudiante, idInstituto);
        scoring.calculados.push({
          idEstudiante,
          puntajeGlobal: r.puntajeGlobal,
        });
      } catch (e) {
        scoring.errores.push({
          idEstudiante,
          error: e instanceof Error ? e.message : "Error",
        });
      }
    }

    // ── 2. Quitar asignación del simulacro a los estudiantes ───────────────
    const removeResult = { updated: [] as string[], notFound: [] as string[] };

    for (const idEstudiante of idsEstudiantes) {
      const student = await db
        .collection("students")
        .findOne({ id_estudiante: idEstudiante });

      if (!student) {
        removeResult.notFound.push(idEstudiante);
        continue;
      }

      if (
        student.examenes_asignados &&
        Array.isArray(student.examenes_asignados)
      ) {
        const originalLength = student.examenes_asignados.length;
        const nuevosExamenes = student.examenes_asignados.filter(
          (examen: any) =>
            examen.id_simulacro !== idSimulacro &&
            examen.classroomId !== classroomId,
        );

        if (originalLength !== nuevosExamenes.length) {
          await db
            .collection("students")
            .updateOne(
              { _id: student._id },
              { $set: { examenes_asignados: nuevosExamenes } },
            );
          removeResult.updated.push(idEstudiante);
        }
      }
    }

    // ── 3. Recalibrar contadores ───────────────────────────────────────────
    const contadoresActualizados = await recalibrarContadores(db);

    return res.status(200).json({
      ok: true,
      resumen: {
        simulacro: idSimulacro,
        instituto: idInstituto,
        totalEstudiantes: idsEstudiantes.length,
        scoringCalculados: scoring.calculados.length,
        scoringErrores: scoring.errores.length,
        desasignados: removeResult.updated.length,
        noEncontrados: removeResult.notFound.length,
        contadoresActualizados,
      },
      scoring: scoring.calculados,
      errores: scoring.errores,
      desasignados: removeResult.updated,
    });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return res.status(500).json({ ok: false, error: mensaje });
  }
});

// ─── Helper: recalibrar contadores desde resultados_preguntas ─────────────────

async function recalibrarContadores(db: mongoose.mongo.Db): Promise<number> {
  const resultados = await db
    .collection("resultados_preguntas")
    .aggregate([
      { $match: { idPregunta: { $exists: true, $nin: [null, ""] } } },
      {
        $group: {
          _id: "$idPregunta",
          trueCount: { $sum: { $cond: [{ $eq: ["$respuesta", true] }, 1, 0] } },
          falseCount: {
            $sum: { $cond: [{ $eq: ["$respuesta", false] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
    ])
    .toArray();

  if (resultados.length === 0) return 0;

  const bulkOps = resultados.map((r) => {
    const difficulty = parseFloat((r.trueCount / r.total).toFixed(4));
    return {
      updateOne: {
        filter: { _id: r._id },
        update: {
          $set: {
            trueCount: r.trueCount,
            falseCount: r.falseCount,
            total_answers: r.total,
            difficulty,
            weight: parseFloat((1 - difficulty).toFixed(4)),
            is_calibrated: r.total >= 5,
            last_updated: new Date(),
          },
        },
        upsert: true,
      },
    };
  });

  await db
    .collection("contadores_preguntas")
    .bulkWrite(bulkOps, { ordered: false });
  return bulkOps.length;
}

export default router;
