import { Router } from 'express';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import {
  generateSimulacro,
  generateSimulacroAlias,
  getAcademicLevelByScore,
  getAreasByIdsBulk,
  getAreasByIdsBulkCompatibility,
  getQuestionById,
  getQuestionsByTypeAndArea,
  getQuestionsByTypeAndAreaCompatibility,
  getSubjectById,
  getSubjectsByIdsBulk,
} from './academic.controller';

const router = Router();

// Endpoint: Obtener areas por ids (masivo)- Traer varias areas de un grado en una sola consulta.
// Body: { grado, ids[] }
router.post('/areas/bulk', asyncHandler(getAreasByIdsBulk));

// Endpoint: Generar simulacro (alias 1). Armar un simulacro con preguntas segun grado/valor y cantidad.
router.get('/generate-simulacro/:value/:cantidad', asyncHandler(generateSimulacroAlias));

// Endpoint: Obtener areas por ids (compatibilidad). Hace lo mismo que /areas/bulk, pero en una ruta alternativa.
// Body: { grado, ids[] }
router.post('/get-areas/bulk', asyncHandler(getAreasByIdsBulkCompatibility));

// Endpoint: Obtener asignaturas por ids (masivo). Traer varias asignaturas de un grado en una sola consulta.
// Body: { grado, ids[] }
router.post('/subjects/bulk', asyncHandler(getSubjectsByIdsBulk));

// Endpoint: Obtener una asignatura por id. Consultar el detalle de una asignatura especifica por grado.
router.get('/subjects/:idAsignature/:valueGrado', asyncHandler(getSubjectById));

// Endpoint: Generar simulacro (ruta principal).Construir un simulacro con la cantidad de preguntas solicitada.
router.get('/simulacro/:value/:cantidad', asyncHandler(generateSimulacro));

// Endpoint: Obtener pregunta por id. Consultar una pregunta especifica por su identificador.
router.get('/questions/:idquestion/:idProgram?', asyncHandler(getQuestionById));

// Endpoint: Obtener preguntas por programa y area/tipo. Traer preguntas filtradas por programa y valor de clasificacion.
router.get('/questions-by-type/:idPrograma/:type/:value', asyncHandler(getQuestionsByTypeAndArea));

// Endpoint: Obtener nivel academico por puntaje. Calcular o consultar el nivel academico segun coleccion, id y score.
router.get('/academic-level/:collectionName/:id/:score', asyncHandler(getAcademicLevelByScore));

// Endpoint: Obtener preguntas por tipo (compatibilidad). Hace lo mismo que /questions-by-type con respuesta directa en JSON.
router.get('/preguntas-por-tipo/:idPrograma/:type/:value', asyncHandler(getQuestionsByTypeAndAreaCompatibility));

export default router;