import { Router } from 'express';
import {
  calcularBatchSaber11,
  calcularBatchUnal,
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
router.post('/saber11/calcular-batch', calcularBatchSaber11);


/**
* Calcula puntajes UNAL para un grupo. Mismo patrón que saber11/calcular-batch.
* Áreas: 0–15 (escala UNAL). Global: 0–1000 (media=500, SD=100).
*
* Body: { idInstituto, idSimulacro, estudiantes: [{ idEstudiante, subjects[] }] }
 */
router.post('/unal/calcular-batch', calcularBatchUnal);

/**
 * Recalcula difficulty y weight en contadores_preguntas
 * usando todos los datos actuales de resultados_preguntas.
 */
router.post('/recalibrar', recalibrarScoring);

export default router;