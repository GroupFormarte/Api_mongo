import { Router, Request, Response } from 'express';
import { AcademicService } from '../../../../application/services/AcademicService';
import { asyncHandler, AppError } from '../../../../shared/middleware/errorHandler';
import ApiResponse from '../../../../shared/utils/ApiResponse';

const router = Router();
const academicService = new AcademicService();

/**
 * Endpoint: Obtener areas por ids (masivo).
 * Para que sirve:
 * - Traer varias areas de un grado en una sola consulta.
 * Recibe:
 * - Body: { grado, ids[] }
 * Responde:
 * - Lista de areas encontradas.
 */
router.post('/areas/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { grado, ids } = req.body;

  if (!grado || !ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, 'Se requieren los campos "grado" e "ids" (array)');
  }

  const result = await academicService.getAreasByIds(grado, ids);
  return ApiResponse.success(res, result, 'Areas retrieved successfully');
}));

/**
 * Endpoint: Generar simulacro (alias 1).
 * Para que sirve:
 * - Armar un simulacro con preguntas segun grado/valor y cantidad.
 * Recibe:
 * - Params: value, cantidad
 * Responde:
 * - Estructura del simulacro generado.
 */
router.get('/generate-simulacro/:value/:cantidad', asyncHandler(async (req: Request, res: Response) => {
  const { value, cantidad } = req.params;
  const result = await academicService.generateSimulacro(value, cantidad);
   return ApiResponse.success(res, result, 'Subjects retrieved successfully');
}));

/**
 * Endpoint: Obtener areas por ids (compatibilidad).
 * Para que sirve:
 * - Hace lo mismo que /areas/bulk, pero en una ruta alternativa.
 * Recibe:
 * - Body: { grado, ids[] }
 * Responde:
 * - Lista de areas encontradas.
 */
router.post('/get-areas/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { grado, ids } = req.body;
  const result = await academicService.getAreasByIds(grado, ids);
  res.status(200).json(result);
}));

/**
 * Endpoint: Obtener asignaturas por ids (masivo).
 * Para que sirve:
 * - Traer varias asignaturas de un grado en una sola consulta.
 * Recibe:
 * - Body: { grado, ids[] }
 * Responde:
 * - Lista de asignaturas encontradas.
 */
router.post('/subjects/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { grado, ids } = req.body;

  if (!grado || !ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, 'Se requieren los campos "grado" e "ids" (array)');
  }

  const result = await academicService.getSubjectsByIds(grado, ids);
  return ApiResponse.success(res, result, 'Subjects retrieved successfully');
}));

/**
 * Endpoint: Obtener una asignatura por id.
 * Para que sirve:
 * - Consultar el detalle de una asignatura especifica por grado.
 * Recibe:
 * - Params: idAsignature, valueGrado
 * Responde:
 * - Asignatura encontrada, o 404 si no existe.
 */
router.get('/subjects/:idAsignature/:valueGrado', asyncHandler(async (req: Request, res: Response) => {
  const { idAsignature, valueGrado } = req.params;

  const result = await academicService.getSubjectById(idAsignature, valueGrado);
  if (!result) {
    return ApiResponse.notFound(res, 'Asignatura no encontrada');
  }

  return ApiResponse.success(res, result, 'Subject retrieved successfully');
}));

/**
 * Endpoint: Generar simulacro (ruta principal).
 * Para que sirve:
 * - Construir un simulacro con la cantidad de preguntas solicitada.
 * Recibe:
 * - Params: value, cantidad
 * Responde:
 * - Simulacro generado.
 */
router.get('/simulacro/:value/:cantidad', asyncHandler(async (req: Request, res: Response) => {
  const { value, cantidad } = req.params;

  const result = await academicService.generateSimulacro(value, cantidad);
  return ApiResponse.success(res, result, 'Simulacro generated successfully');
}));

/**
 * Endpoint: Obtener pregunta por id.
 * Para que sirve:
 * - Consultar una pregunta especifica por su identificador.
 * Recibe:
 * - Params: idquestion (idProgram es opcional y no se usa aqui)
 * Responde:
 * - Pregunta encontrada, o 404 si no existe.
 */
router.get('/questions/:idquestion/:idProgram?', asyncHandler(async (req: Request, res: Response) => {
  const { idquestion } = req.params;

  const result = await academicService.getQuestionById(idquestion);
  if (!result) {
    return ApiResponse.notFound(res, 'Pregunta no encontrada');
  }

  return ApiResponse.success(res, result, 'Question retrieved successfully');
}));

/**
 * Endpoint: Obtener preguntas por programa y area/tipo.
 * Para que sirve:
 * - Traer preguntas filtradas por programa y valor de clasificacion.
 * Recibe:
 * - Params: idPrograma, type, value (type no se usa en esta implementacion)
 * Responde:
 * - Lista de preguntas filtradas.
 */
router.get('/questions-by-type/:idPrograma/:type/:value', asyncHandler(async (req: Request, res: Response) => {
  const { idPrograma, value } = req.params;

  const result = await academicService.getQuestionsByTypeAndArea(idPrograma, value);
  return ApiResponse.success(res, result, 'Questions retrieved successfully');
}));

/**
 * Endpoint: Obtener nivel academico por puntaje.
 * Para que sirve:
 * - Calcular o consultar el nivel academico segun coleccion, id y score.
 * Recibe:
 * - Params: collectionName, id, score
 * Responde:
 * - Nivel academico correspondiente.
 */
router.get('/academic-level/:collectionName/:id/:score', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName, id, score } = req.params;

  const result = await academicService.getAcademicLevelByScore(collectionName, id, score);
  return ApiResponse.success(res, result, 'Academic level retrieved successfully');
}));

/**
 * Endpoint: Obtener preguntas por tipo (compatibilidad).
 * Para que sirve:
 * - Hace lo mismo que /questions-by-type con respuesta directa en JSON.
 * Recibe:
 * - Params: idPrograma, type, value (type no se usa en esta implementacion)
 * Responde:
 * - Lista de preguntas filtradas.
 */
router.get('/preguntas-por-tipo/:idPrograma/:type/:value', asyncHandler(async (req: Request, res: Response) => {
  const { idPrograma, value } = req.params;
  const result = await academicService.getQuestionsByTypeAndArea(idPrograma, value);
  res.status(200).json(result);
}));

export default router;