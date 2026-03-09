import { Router } from 'express';
import {
    getGlobalAnalysis,
    getStudentSubjectAnalysis,
    getPositionsAnalysis
} from '../../controllers/progressController';

const router = Router();

router
    .get('/analisis/global/:idGrado/:idInstituto', getGlobalAnalysis)
    .get('/analisis/asignaturas/:idEstudiante/:idGrado/:idInstituto', getStudentSubjectAnalysis)
    .get('/analisis/posiciones/:idGrado/:idInstituto', getPositionsAnalysis)

export default router;