import { Request, Response } from 'express';
import { AcademicService } from '../../../application/services/AcademicService';
import ApiResponse from '../../../shared/utils/ApiResponse';

const academicService = new AcademicService();

export const getAreasByIdsBulk = async (req: Request, res: Response) => {
	const { grado, ids } = req.body;

	if (!grado || !ids || !Array.isArray(ids) || ids.length === 0) {
		return ApiResponse.badRequest(res, 'Se requieren los campos "grado" e "ids" (array)');
	}

	const result = await academicService.getAreasByIds(grado, ids);
	return ApiResponse.success(res, result, 'Areas retrieved successfully');
};

export const generateSimulacroAlias = async (req: Request, res: Response) => {
	const { value, cantidad } = req.params;
	const result = await academicService.generateSimulacro(value, cantidad);
	return ApiResponse.success(res, result, 'Subjects retrieved successfully');
};

export const getAreasByIdsBulkCompatibility = async (req: Request, res: Response) => {
	const { grado, ids } = req.body;
	const result = await academicService.getAreasByIds(grado, ids);
	return res.status(200).json(result);
};

export const getSubjectsByIdsBulk = async (req: Request, res: Response) => {
	const { grado, ids } = req.body;

	if (!grado || !ids || !Array.isArray(ids) || ids.length === 0) {
		return ApiResponse.badRequest(res, 'Se requieren los campos "grado" e "ids" (array)');
	}

	const result = await academicService.getSubjectsByIds(grado, ids);
	return ApiResponse.success(res, result, 'Subjects retrieved successfully');
};

export const getSubjectById = async (req: Request, res: Response) => {
	const { idAsignature, valueGrado } = req.params;

	const result = await academicService.getSubjectById(idAsignature, valueGrado);
	if (!result) {
		return ApiResponse.notFound(res, 'Asignatura no encontrada');
	}

	return ApiResponse.success(res, result, 'Subject retrieved successfully');
};

export const generateSimulacro = async (req: Request, res: Response) => {
	const { value, cantidad } = req.params;

	const result = await academicService.generateSimulacro(value, cantidad);
	return ApiResponse.success(res, result, 'Simulacro generated successfully');
};

export const getQuestionById = async (req: Request, res: Response) => {
	const { idquestion } = req.params;

	const result = await academicService.getQuestionById(idquestion);
	if (!result) {
		return ApiResponse.notFound(res, 'Pregunta no encontrada');
	}

	return ApiResponse.success(res, result, 'Question retrieved successfully');
};

export const getQuestionsByTypeAndArea = async (req: Request, res: Response) => {
	const { idPrograma, value } = req.params;

	const result = await academicService.getQuestionsByTypeAndArea(idPrograma, value);
	return ApiResponse.success(res, result, 'Questions retrieved successfully');
};

export const getAcademicLevelByScore = async (req: Request, res: Response) => {
	const { collectionName, id, score } = req.params;

	const result = await academicService.getAcademicLevelByScore(collectionName, id, score);
	return ApiResponse.success(res, result, 'Academic level retrieved successfully');
};

export const getQuestionsByTypeAndAreaCompatibility = async (req: Request, res: Response) => {
	const { idPrograma, value } = req.params;
	const result = await academicService.getQuestionsByTypeAndArea(idPrograma, value);
	return res.status(200).json(result);
};
