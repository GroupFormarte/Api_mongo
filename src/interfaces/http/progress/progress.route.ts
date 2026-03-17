import { Router } from 'express';
import { getGlobalAnalysis, getStudentSubjectAnalysis, getPositionsAnalysis } from './progress.controller';
import { asyncHandler } from '../../../shared/middleware/errorHandler';

const router = Router();

router
    .get('/analisis/global/:idGrado/:idInstituto', asyncHandler(getGlobalAnalysis))
    .get('/analisis/asignaturas/:idEstudiante/:idGrado/:idInstituto', asyncHandler(getStudentSubjectAnalysis))
    .get('/analisis/posiciones/:idGrado/:idInstituto', asyncHandler(getPositionsAnalysis))

export default router;