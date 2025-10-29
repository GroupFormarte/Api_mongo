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
const StudentService_1 = require("../../../../application/services/StudentService");
const errorHandler_1 = require("../../../../shared/middleware/errorHandler");
const ApiResponse_1 = __importDefault(require("../../../../shared/utils/ApiResponse"));
const DynamicRepository_1 = require("../../../../infrastructure/repositories/DynamicRepository");
const router = (0, express_1.Router)();
const studentService = new StudentService_1.StudentService();
const repository = new DynamicRepository_1.DynamicRepository();
// Get student by id_estudiante query parameter (without collection)
router.get('/', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_estudiante } = req.query;
    if (id_estudiante) {
        const result = yield studentService.getStudentByStudentId('students', id_estudiante);
        if (!result) {
            return ApiResponse_1.default.notFound(res, 'Estudiante no encontrado');
        }
        return ApiResponse_1.default.success(res, result, 'Student retrieved successfully');
    }
    // If no id_estudiante query, return all students with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = yield studentService.getAllStudents('students');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResult = result.slice(startIndex, endIndex);
    return ApiResponse_1.default.paginated(res, paginatedResult, page, limit, result.length, 'Students retrieved successfully');
})));
router.get('/get-my-position/:grado/:id_student', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_student, grado } = req.params;
    console.log({ id_student, grado });
    const result = yield studentService.getStudentPosition(grado, id_student);
    return ApiResponse_1.default.success(res, result, ' successfully');
})));
// Get student position in ranking
router.get('/position/:grado/:id_student', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_student, grado } = req.params;
    const result = yield studentService.getStudentPosition(grado, id_student);
    return ApiResponse_1.default.success(res, result, 'Student position retrieved successfully');
})));
// Obtener documento por ID de estudiante
router.get('/:collectionName/convert_id/:id', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    const result = yield studentService.getStudentByStudentId(collectionName, id);
    if (!result) {
        throw new errorHandler_1.AppError('Estudiante no encontrado', 404);
    }
    return ApiResponse_1.default.success(res, result, 'Student position retrieved successfully');
})));
// Bulk update students
router.put('/bulk-update', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { updates } = req.body;
    const students = updates;
    if (!Array.isArray(students) || students.length === 0) {
        return ApiResponse_1.default.badRequest(res, 'Se requiere un array de estudiantes para actualizar');
    }
    const result = yield studentService.updateStudentsBulk("students", students);
    return ApiResponse_1.default.bulk(res, {
        successful: result.updated,
        failed: result.notFound.map(id => ({ id, reason: 'Not found' })),
        total: students.length
    }, 'Bulk update completed');
})));
// Bulk create unique students
router.post('/bulk-create-unique', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
        return ApiResponse_1.default.badRequest(res, 'Se requiere un array de estudiantes');
    }
    const result = yield studentService.createStudentsUnique('students', students);
    return ApiResponse_1.default.bulk(res, {
        successful: result.created,
        failed: result.existing.map((student) => ({
            id: student.id_estudiante,
            reason: 'Already exists'
        })),
        total: students.length
    }, 'Bulk create completed');
})));
// Remove examen asignado by id_simulacro from multiple students
router.post('/remove-examen', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ids_estudiantes, simulationId } = req.body;
    const id_simulacro = simulationId;
    if (!Array.isArray(ids_estudiantes) || ids_estudiantes.length === 0) {
        return ApiResponse_1.default.badRequest(res, 'Se requiere un array de ids_estudiantes');
    }
    if (!id_simulacro) {
        return ApiResponse_1.default.badRequest(res, 'Se requiere el id_simulacro');
    }
    const result = yield studentService.removeExamenAsignado(ids_estudiantes, id_simulacro);
    return ApiResponse_1.default.bulk(res, {
        successful: result.updated,
        failed: result.notFound.map((id) => ({ id, reason: 'Student not found' })),
        total: ids_estudiantes.length
    }, 'Examen removed from students');
})));
// Get student by ID
router.get('/:collectionName/:id', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    console.log(collectionName, id);
    const result = yield studentService.getStudentById(collectionName, id);
    if (!result) {
        return ApiResponse_1.default.notFound(res, 'Estudiante no encontrado');
    }
    return ApiResponse_1.default.success(res, result, 'Student retrieved successfully');
})));
// Get student by student ID
router.get('/:collectionName/by-student-id/:id', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    const result = yield studentService.getStudentByStudentId(collectionName, id);
    if (!result) {
        return ApiResponse_1.default.notFound(res, 'Estudiante no encontrado');
    }
    return ApiResponse_1.default.success(res, result, 'Student retrieved successfully');
})));
// Search students by field and value
router.get('/search/:field/:value', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { field, value } = req.params;
    const documents = yield studentService.searchByField("students", field, value);
    if (documents.length === 0) {
        return ApiResponse_1.default.notFound(res, `No se encontraron documentos para el campo "${field}" con el valor "${value}"`);
    }
    return ApiResponse_1.default.success(res, documents, 'Search results retrieved successfully');
})));
// Update student
router.put('/:id', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    const result = yield studentService.updateStudent('students', id, data);
    if (!result) {
        return ApiResponse_1.default.notFound(res, 'Estudiante no encontrado');
    }
    return ApiResponse_1.default.updated(res, result, 'Student updated successfully');
})));
// Actualizar documento por ID
router.put('/:collectionName/:id', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    const data = req.body;
    console.log({ collectionName, id, data });
    const document = yield repository.updateById(collectionName, id, data);
    if (!document) {
        throw new errorHandler_1.AppError('Documento no encontrado', 404);
    }
    res.status(200).json(document);
})));
// Delete student
router.delete('/:collectionName/:id', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    const result = yield studentService.deleteStudent(collectionName, id);
    if (!result) {
        return ApiResponse_1.default.notFound(res, 'Estudiante no encontrado');
    }
    return ApiResponse_1.default.deleted(res, 'Student deleted successfully');
})));
// Get all students
router.get('/:collectionName', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = yield studentService.getAllStudents(collectionName);
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResult = result.slice(startIndex, endIndex);
    return ApiResponse_1.default.paginated(res, paginatedResult, page, limit, result.length, 'Students retrieved successfully');
})));
// Create student
router.post('/:collectionName/:id?', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    const data = req.body.data || req.body;
    const idAux = id !== null && id !== void 0 ? id : data.id_student;
    const result = yield studentService.createStudent(collectionName, data, idAux);
    console.log("Creating student:", { collectionName, id });
    return ApiResponse_1.default.created(res, result, 'Student created successfully');
})));
exports.default = router;
