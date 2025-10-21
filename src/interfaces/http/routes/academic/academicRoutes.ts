import { Router, Request, Response } from 'express';
import { AcademicService } from '../../../../application/services/AcademicService';
import { asyncHandler, AppError } from '../../../../shared/middleware/errorHandler';
import ApiResponse from '../../../../shared/utils/ApiResponse';

const router = Router();
const academicService = new AcademicService();

// Get areas by IDs in bulk
router.post('/areas/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { grado, ids } = req.body;

  if (!grado || !ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, 'Se requieren los campos "grado" e "ids" (array)');
  }

  const result = await academicService.getAreasByIds(grado, ids);
  return ApiResponse.success(res, result, 'Areas retrieved successfully');
}));
router.get('/generate-simulacro/:value/:cantidad', asyncHandler(async (req: Request, res: Response) => {
  const { value, cantidad } = req.params;
  const result = await academicService.generateSimulacro(value, cantidad);
   return ApiResponse.success(res, result, 'Subjects retrieved successfully');
}));
router.post('/get-areas/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { grado, ids } = req.body;
  const result = await academicService.getAreasByIds(grado, ids);
  res.status(200).json(result);
}));
// Get subjects by IDs in bulk
router.post('/subjects/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { grado, ids } = req.body;

  if (!grado || !ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, 'Se requieren los campos "grado" e "ids" (array)');
  }

  const result = await academicService.getSubjectsByIds(grado, ids);
  return ApiResponse.success(res, result, 'Subjects retrieved successfully');
}));

// Get subject by ID
router.get('/subjects/:idAsignature/:valueGrado', asyncHandler(async (req: Request, res: Response) => {
  const { idAsignature, valueGrado } = req.params;

  const result = await academicService.getSubjectById(idAsignature, valueGrado);
  if (!result) {
    return ApiResponse.notFound(res, 'Asignatura no encontrada');
  }

  return ApiResponse.success(res, result, 'Subject retrieved successfully');
}));

// Generate simulacro
router.get('/simulacro/:value/:cantidad', asyncHandler(async (req: Request, res: Response) => {
  const { value, cantidad } = req.params;

  const result = await academicService.generateSimulacro(value, cantidad);
  return ApiResponse.success(res, result, 'Simulacro generated successfully');
}));

// Get question by ID
router.get('/questions/:idquestion/:idProgram?', asyncHandler(async (req: Request, res: Response) => {
  const { idquestion } = req.params;

  const result = await academicService.getQuestionById(idquestion);
  if (!result) {
    return ApiResponse.notFound(res, 'Pregunta no encontrada');
  }

  return ApiResponse.success(res, result, 'Question retrieved successfully');
}));

// Get questions by type and area
router.get('/questions-by-type/:idPrograma/:type/:value', asyncHandler(async (req: Request, res: Response) => {
  const { idPrograma, value } = req.params;

  const result = await academicService.getQuestionsByTypeAndArea(idPrograma, value);
  return ApiResponse.success(res, result, 'Questions retrieved successfully');
}));

// Get academic level by score
router.get('/academic-level/:collectionName/:id/:score', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName, id, score } = req.params;

  const result = await academicService.getAcademicLevelByScore(collectionName, id, score);
  return ApiResponse.success(res, result, 'Academic level retrieved successfully');
}));

router.get('/preguntas-por-tipo/:idPrograma/:type/:value', asyncHandler(async (req: Request, res: Response) => {
  const { idPrograma, value } = req.params;
  const result = await academicService.getQuestionsByTypeAndArea(idPrograma, value);
  res.status(200).json(result);
}));

export default router;