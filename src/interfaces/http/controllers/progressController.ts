import { Request, Response } from 'express';
import { ProgressService } from '../../../application/services/ProgressService';

const progressService = new ProgressService();

/**
 * Endpoint: Analisis global por grado e instituto.
 * Para que sirve:
 * - Ver el rendimiento general por area y asignatura.
 * - Obtener un resumen mensual de aciertos y errores.
 * Parametros:
 * - idGrado, idInstituto (params)
 * - fechaInicio, fechaFin (query opcionales). Si no llegan, usa el anio actual.
 */
export const getGlobalAnalysis = async (req: Request, res: Response) => {
  const { idGrado, idInstituto } = req.params;
  const { fechaInicio, fechaFin } = req.query;

  try {
    const data = await progressService.getGlobalAnalysis({
      idGrado,
      idInstituto,
      fechaInicio: fechaInicio as string | undefined,
      fechaFin: fechaFin as string | undefined
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el analisis global', error });
  }
};

/**
 * Endpoint: Analisis de asignaturas por estudiante.
 * Para que sirve:
 * - Mostrar como le va a un estudiante en cada asignatura y area.
 * - Entregar balance mensual del estudiante en el periodo consultado.
 * Parametros:
 * - idEstudiante, idGrado, idInstituto (params)
 * - fechaInicio, fechaFin (query opcionales). Si no llegan, usa el anio actual.
 */
export const getStudentSubjectAnalysis = async (req: Request, res: Response) => {
  const { idEstudiante, idGrado, idInstituto } = req.params;
  const { fechaInicio, fechaFin } = req.query;

  try {
    const data = await progressService.getStudentSubjectAnalysis({
      idEstudiante,
      idGrado,
      idInstituto,
      fechaInicio: fechaInicio as string | undefined,
      fechaFin: fechaFin as string | undefined
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el analisis por asignaturas', error });
  }
};

/**
 * Endpoint: Posiciones (ranking) por grado e instituto.
 * Para que sirve:
 * - Crear rankings de estudiantes por asignatura y por area.
 * - Identificar el mejor estudiante en cada asignatura y en cada area.
 * Parametros:
 * - idGrado, idInstituto (params)
 * - fechaInicio, fechaFin (query opcionales). Si no llegan, usa el anio actual.
 */
export const getPositionsAnalysis = async (req: Request, res: Response) => {
  const { idGrado, idInstituto } = req.params;
  const { fechaInicio, fechaFin } = req.query;

  try {
    const data = await progressService.getPositionsAnalysis({
      idGrado,
      idInstituto,
      fechaInicio: fechaInicio as string | undefined,
      fechaFin: fechaFin as string | undefined
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener posiciones por asignatura y area', error });
  }
};