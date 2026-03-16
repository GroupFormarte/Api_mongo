import { Request, Response } from 'express';
import { ProgressService } from '../../../application/services/ProgressService';

const progressService = new ProgressService();

export const getGlobalAnalysis = async (req: Request, res: Response) => {
  const { idGrado, idInstituto } = req.params;
  const { fechaInicio, fechaFin } = req.query;

  const data = await progressService.getGlobalAnalysis({
    idGrado,
    idInstituto,
    fechaInicio: fechaInicio as string | undefined,
    fechaFin: fechaFin as string | undefined
  });

  res.status(200).json(data);
};

export const getStudentSubjectAnalysis = async (req: Request, res: Response) => {
  const { idEstudiante, idGrado, idInstituto } = req.params;
  const { fechaInicio, fechaFin } = req.query;

  const data = await progressService.getStudentSubjectAnalysis({
    idEstudiante,
    idGrado,
    idInstituto,
    fechaInicio: fechaInicio as string | undefined,
    fechaFin: fechaFin as string | undefined
  });

  res.status(200).json(data);
};

export const getPositionsAnalysis = async (req: Request, res: Response) => {
  const { idGrado, idInstituto } = req.params;
  const { fechaInicio, fechaFin } = req.query;

  const data = await progressService.getPositionsAnalysis({
    idGrado,
    idInstituto,
    fechaInicio: fechaInicio as string | undefined,
    fechaFin: fechaFin as string | undefined
  });

  res.status(200).json(data);
};