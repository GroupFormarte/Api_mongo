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

router
  .post('/areas/bulk', asyncHandler(getAreasByIdsBulk))
  .post('/get-areas/bulk', asyncHandler(getAreasByIdsBulkCompatibility))
  .post('/subjects/bulk', asyncHandler(getSubjectsByIdsBulk))

  .get('/subjects/:idAsignature/:valueGrado', asyncHandler(getSubjectById))
  .get('/generate-simulacro/:value/:cantidad', asyncHandler(generateSimulacroAlias))
  .get('/simulacro/:value/:cantidad', asyncHandler(generateSimulacro))
  .get('/questions/:idquestion/:idProgram?', asyncHandler(getQuestionById))
  .get('/questions-by-type/:idPrograma/:type/:value', asyncHandler(getQuestionsByTypeAndArea))
  .get('/academic-level/:collectionName/:id/:score', asyncHandler(getAcademicLevelByScore))
  .get('/preguntas-por-tipo/:idPrograma/:type/:value', asyncHandler(getQuestionsByTypeAndAreaCompatibility))

export default router;