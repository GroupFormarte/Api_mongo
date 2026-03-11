import { Router } from 'express';
import {
  calcularBatchSaber11,
  calcularUdea,
  recalibrarScoring,
} from '../controllers/scoring/scoringController';

const router = Router();

/**
 * Calcula el puntaje Saber 11 Semi-IRT recibiendo los subjects directamente desde Flutter.
 *
 * Body:
 * {
 *   idEstudiante: string,
 *   idInstituto:  string,
 *   idSimulacro:  string,       (opcional)
 *   subjects: [
 *     { name: "Matemáticas",       correctAnswers: 17, incorrectAnswers: 33 },
 *     { name: "Lectura Crítica",   correctAnswers: 21, incorrectAnswers: 20 },
 *     { name: "Ciencias Sociales", correctAnswers: 36, incorrectAnswers: 14 },
 *     { name: "Ciencias Naturales",correctAnswers: 25, incorrectAnswers: 33 },
 *     { name: "Inglés",            correctAnswers: 15, incorrectAnswers: 40 },
 *   ]
 * }
 */


// ─── En scoring.router.ts ─────────────────────────────────────────────────────
// Reemplaza SOLO el handler de /udea/grupo/:idGrado/:idInstituto

/**
 * POST /api/scoring/udea/calcular
 */
router.post( '/udea/calcular', calcularUdea);

router.post('/saber11/calcular-batch', calcularBatchSaber11);

/**
 * Recalcula difficulty y weight en contadores_preguntas
 * usando todos los datos actuales de resultados_preguntas.
 */
router.post('/recalibrar', recalibrarScoring);

export default router;
