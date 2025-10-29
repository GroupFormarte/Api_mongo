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
const DynamicRepository_1 = require("../../../../infrastructure/repositories/DynamicRepository");
const errorHandler_1 = require("../../../../shared/middleware/errorHandler");
const ApiResponse_1 = __importDefault(require("../../../../shared/utils/ApiResponse"));
const router = (0, express_1.Router)();
const repository = new DynamicRepository_1.DynamicRepository();
// ================================================
// GENERIC CRUD OPERATIONS
// ================================================
// Get documents by IDs in bulk (generic)
router.post('/:collectionName/bulk', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName } = req.params;
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return ApiResponse_1.default.badRequest(res, 'Se requiere un array "ids" con al menos un elemento');
    }
    const documents = yield repository.findByIds(collectionName, ids);
    if (!documents || documents.length === 0) {
        return ApiResponse_1.default.notFound(res, 'No se encontraron documentos para los IDs especificados');
    }
    return ApiResponse_1.default.success(res, documents, 'Documents retrieved successfully');
})));
// Search documents by dynamic field
router.get('/:collectionName/search/:field/:value', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, field, value } = req.params;
    const documents = yield repository.searchByField(collectionName, field, value);
    if (documents.length === 0) {
        return ApiResponse_1.default.notFound(res, `No se encontraron documentos para el campo "${field}" con el valor "${value}"`);
    }
    return ApiResponse_1.default.success(res, documents, 'Search results retrieved successfully');
})));
// Multi-field search
router.get('/:collectionName/multi-search/:query', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, query } = req.params;
    const fields = req.query.fields ? req.query.fields.split(',') : [];
    if (fields.length === 0) {
        return ApiResponse_1.default.badRequest(res, 'Se requiere al menos un campo en el parámetro "fields"');
    }
    const documents = yield repository.multiFieldSearch(collectionName, query, fields);
    return ApiResponse_1.default.success(res, documents, 'Multi-field search completed successfully');
})));
// Search by category
router.get('/:collectionName/category/:category', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, category } = req.params;
    const documents = yield repository.findByCategory(collectionName, category);
    return ApiResponse_1.default.success(res, documents, 'Category search completed successfully');
})));
// Get all documents from a collection
router.get('/:collectionName', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const documents = yield repository.find(collectionName);
    const limit = parseInt(req.query.limit) || documents.length;
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResult = documents.slice(startIndex, endIndex);
    return ApiResponse_1.default.paginated(res, paginatedResult, page, limit, documents.length, 'Documents retrieved successfully');
})));
// Get document by ID
router.get('/:collectionName/:id', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    const document = yield repository.findById(collectionName, id);
    if (!document) {
        return ApiResponse_1.default.notFound(res, 'Documento no encontrado');
    }
    return ApiResponse_1.default.success(res, document, 'Document retrieved successfully');
})));
// Create document
router.post('/:collectionName/:id?', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    const schemaDefinition = req.body.schema || {};
    const data = req.body.data || req.body;
    const idAux = id !== null && id !== void 0 ? id : data.id_student;
    const documentData = idAux ? Object.assign(Object.assign({}, data), { id: idAux }) : data;
    const document = yield repository.create(collectionName, documentData, schemaDefinition);
    return ApiResponse_1.default.created(res, document, 'Document created successfully');
})));
// Update document by ID (full replacement)
router.put('/:collectionName/:id', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    const data = req.body;
    const document = yield repository.updateById(collectionName, id, data);
    if (!document) {
        return ApiResponse_1.default.notFound(res, 'Documento no encontrado');
    }
    return ApiResponse_1.default.updated(res, document, 'Document updated successfully');
})));
// Update or create student answers by id_instituto (prevents overwriting other students' data)
// Receives flat JSON with student data and answers mixed
// If student doesn't exist: creates it with all data
// If student exists: only updates sectionOne/sectionTwo, ignores other fields
router.patch('/assigned_simulation/:documentId/simulacro/:simulacroId/student/:userId', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { documentId, simulacroId, userId } = req.params;
    const flatData = req.body;
    // Validate that required fields are present
    if (!flatData || Object.keys(flatData).length === 0) {
        return ApiResponse_1.default.badRequest(res, 'Se requiere data en el body');
    }
    // Check if at least sectionOne or sectionTwo is present
    if (!flatData.sectionOne && !flatData.sectionTwo) {
        return ApiResponse_1.default.badRequest(res, 'Se requiere al menos sectionOne o sectionTwo');
    }
    // Use id_instituto from body, fallback to documentId if not provided
    const idInstituto = flatData.id_instituto || documentId;
    const document = yield repository.updateOrCreateStudentAnswersByQuery('assigned_simulation', 'id_instituto', idInstituto, simulacroId, flatData);
    if (!document) {
        return ApiResponse_1.default.notFound(res, 'Documento o simulacro no encontrado');
    }
    // Return simplified response without full document
    return ApiResponse_1.default.updated(res, {
        success: true,
        userId: flatData.userId,
        message: 'Student answers updated successfully'
    }, 'Student answers updated successfully');
})));
// Partial update document by ID (only updates specified fields)
router.patch('/:collectionName/:id', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
        return ApiResponse_1.default.badRequest(res, 'Se requiere al menos un campo para actualizar');
    }
    const document = yield repository.partialUpdateById(collectionName, id, data);
    if (!document) {
        return ApiResponse_1.default.notFound(res, 'Documento no encontrado');
    }
    return ApiResponse_1.default.updated(res, document, 'Document partially updated successfully');
})));
// Delete document by ID
router.delete('/:collectionName/:id', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName, id } = req.params;
    const document = yield repository.deleteById(collectionName, id);
    if (!document) {
        return ApiResponse_1.default.notFound(res, 'Documento no encontrado');
    }
    return ApiResponse_1.default.deleted(res, 'Document deleted successfully');
})));
// ================================================
// SYSTEM UTILITIES
// ================================================
// Get cache statistics
router.get('/system/cache/stats', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield repository.getCacheStats();
    return ApiResponse_1.default.success(res, stats, 'Cache statistics retrieved successfully');
})));
// Get collection statistics
router.get('/system/collections/:collectionName/stats', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName } = req.params;
    const stats = yield repository.getCollectionStats(collectionName);
    return ApiResponse_1.default.success(res, stats, 'Collection statistics retrieved successfully');
})));
// Clear cache
router.delete('/system/cache/:collectionName?', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collectionName } = req.params;
    yield repository.invalidateCache(collectionName);
    const message = collectionName
        ? `Cache cleared for collection: ${collectionName}`
        : 'All cache cleared successfully';
    return ApiResponse_1.default.success(res, null, message);
})));
// Preload models
router.post('/system/cache/preload', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collections } = req.body;
    if (!Array.isArray(collections)) {
        return ApiResponse_1.default.badRequest(res, 'Se requiere un array de colecciones');
    }
    yield repository.preloadModels(collections);
    return ApiResponse_1.default.success(res, null, 'Models preloaded successfully');
})));
exports.default = router;
