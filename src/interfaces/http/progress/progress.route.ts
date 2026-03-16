import { Router } from 'express';
import {
    getGlobalAnalysis,
    getStudentSubjectAnalysis,
    getPositionsAnalysis
} from './progress.controller';
import { asyncHandler } from '../../../shared/middleware/errorHandler';

const router = Router();

router
    /**
     * Endpoint: Analisis global por grado e instituto.
     * Para que sirve:
     * - Ver el rendimiento general por area y asignatura.
     * - Obtener un resumen mensual de aciertos y errores.
     * Parametros:
     * - idGrado, idInstituto (params)
     * - fechaInicio, fechaFin (query opcionales). Si no llegan, usa el anio actual.
     */
    .get('/analisis/global/:idGrado/:idInstituto', asyncHandler(getGlobalAnalysis))

    /**
     * Endpoint: Analisis de asignaturas por estudiante.
     * Para que sirve:
     * - Mostrar como le va a un estudiante en cada asignatura y area.
     * - Entregar balance mensual del estudiante en el periodo consultado.
     * Parametros:
     * - idEstudiante, idGrado, idInstituto (params)
     * - fechaInicio, fechaFin (query opcionales). Si no llegan, usa el anio actual.
     */
    .get('/analisis/asignaturas/:idEstudiante/:idGrado/:idInstituto', asyncHandler(getStudentSubjectAnalysis))

    /**
     * Endpoint: Posiciones (ranking) por grado e instituto.
     * Para que sirve:
     * - Crear rankings de estudiantes por asignatura y por area.
     * - Identificar el mejor estudiante en cada asignatura y en cada area.
     * Parametros:
     * - idGrado, idInstituto (params)
     * - fechaInicio, fechaFin (query opcionales). Si no llegan, usa el anio actual.
     */
    .get('/analisis/posiciones/:idGrado/:idInstituto', asyncHandler(getPositionsAnalysis))

export default router;