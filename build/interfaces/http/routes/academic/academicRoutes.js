"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AcademicService_1 = require("../../../../application/services/AcademicService");
const errorHandler_1 = require("../../../../shared/middleware/errorHandler");
const ApiResponse_1 = __importDefault(require("../../../../shared/utils/ApiResponse"));
const router = (0, express_1.Router)();
const academicService = new AcademicService_1.AcademicService();
// Get areas by IDs in bulk
router.post('/areas/bulk', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { grado, ids } = req.body;
    if (!grado || !ids || !Array.isArray(ids) || ids.length === 0) {
        return ApiResponse_1.default.badRequest(res, 'Se requieren los campos "grado" e "ids" (array)');
    }
    const result = yield academicService.getAreasByIds(grado, ids);
    return ApiResponse_1.default.success(res, result, 'Areas retrieved successfully');
})));
router.get('/generate-simulacro/:value/:cantidad', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { value, cantidad } = req.params;
    const result = yield academicService.generateSimulacro(value, cantidad);
    return ApiResponse_1.default.success(res, result, 'Subjects retrieved successfully');
})));
router.post('/get-areas/bulk', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { grado, ids } = req.body;
    const result = yield academicService.getAreasByIds(grado, ids);
    res.status(200).json(result);
})));
// Get subjects by IDs in bulk
router.post('/subjects/bulk', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { grado, ids } = req.body;
    if (!grado || !ids || !Array.isArray(ids) || ids.length === 0) {
        return ApiResponse_1.default.badRequest(res, 'Se requieren los campos "grado" e "ids" (array)');
    }
    const result = yield academicService.getSubjectsByIds(grado, ids);
    return ApiResponse_1.default.success(res, result, 'Subjects retrieved successfully');
})));
// Get subject by ID
router.get('/subjects/:idAsignature/:valueGrado', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idAsignature, valueGrado } = req.params;
    const result = yield academicService.getSubjectById(idAsignature, valueGrado);
    if (!result) {
        return ApiResponse_1.default.notFound(res, 'Asignatura no encontrada');
    }
    return ApiResponse_1.default.success(res, result, 'Subject retrieved successfully');
})));
// Generate simulacro
router.get('/simulacro/:value/:cantidad', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { value, cantidad } = req.params;
    const result = yield academicService.generateSimulacro(value, cantidad);
    return ApiResponse_1.default.success(res, result, 'Simulacro generated successfully');
})));
// Get question by ID
router.get('/questions/:idquestion/:idProgram?', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idquestion } = req.params;
    const result = yield academicService.getQuestionById(idquestion);
    if (!result) {
        return ApiResponse_1.default.notFound(res, 'Pregunta no encontrada');
    }
    return ApiResponse_1.default.success(res, result, 'Question retrieved successfully');
})));
// Get questions by type and area
router.get('/questions-by-type/:idPrograma/:type/:value', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idPrograma, value } = req.params;
    const result = yield academicService.getQuestionsByTypeAndArea(idPrograma, value);
    return ApiResponse_1.default.success(res, result, 'Questions retrieved successfully');
})));
// Get academic level by score
router.get('/academic-level/:collectionName/:id/:score', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id, score } = req.params;
    const result = yield academicService.getAcademicLevelByScore(collectionName, id, score);
    return ApiResponse_1.default.success(res, result, 'Academic level retrieved successfully');
})));
router.get('/preguntas-por-tipo/:idPrograma/:type/:value', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idPrograma, value } = req.params;
    const result = yield academicService.getQuestionsByTypeAndArea(idPrograma, value);
    res.status(200).json(result);
})));
exports.default = router;
