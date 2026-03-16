import { Router } from 'express';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import {
  clearCache,
  createDocument,
  deleteDocumentById,
  getAllDocuments,
  getCacheStats,
  getCollectionStats,
  getDocumentById,
  getDocumentsByIdsBulk,
  multiFieldSearch,
  partialUpdateDocumentById,
  preloadModels,
  searchByCategory,
  searchDocumentsByField,
  updateAssignedSimulationResults,
  updateAssignedSimulationSessionDetails,
  updateDocumentById,
  updateOrCreateStudentAnswers,
} from './system.controller';

const router = Router();

// Get documents by IDs in bulk (generic)
router.post('/:collectionName/bulk', asyncHandler(getDocumentsByIdsBulk));

// Search documents by dynamic field
router.get('/:collectionName/search/:field/:value', asyncHandler(searchDocumentsByField));

// Multi-field search
router.get('/:collectionName/multi-search/:query', asyncHandler(multiFieldSearch));

// Search by category
router.get('/:collectionName/category/:category', asyncHandler(searchByCategory));

// Get all documents from a collection
router.get('/:collectionName', asyncHandler(getAllDocuments));

// Get document by ID
router.get('/:collectionName/:id', asyncHandler(getDocumentById));

// Create document
router.post('/:collectionName/:id?', asyncHandler(createDocument));

router.patch('/assigned_simulation/:id/simulacro/:simulacroId/resultados',
  asyncHandler(updateAssignedSimulationResults)
);

router.patch('/assigned_simulation/:id/simulacro/:simulacroId/session-details',
  asyncHandler(updateAssignedSimulationSessionDetails)
);

// Update document by ID (full replacement)
router.put('/:collectionName/:id', asyncHandler(updateDocumentById));

// Update or create student answers by id_instituto (prevents overwriting other students' data)
// Receives flat JSON with student data and answers mixed
// If student doesn't exist: creates it with all data
// If student exists: only updates sectionOne/sectionTwo, ignores other fields
router.patch('/assigned_simulation/:documentId/simulacro/:simulacroId/student/:userId', asyncHandler(updateOrCreateStudentAnswers));

// Partial update document by ID (only updates specified fields)
router.patch('/:collectionName/:id', asyncHandler(partialUpdateDocumentById));

// Delete document by ID
router.delete('/:collectionName/:id', asyncHandler(deleteDocumentById));

// Get cache statistics
router.get('/system/cache/stats', asyncHandler(getCacheStats));

// Get collection statistics
router.get('/system/collections/:collectionName/stats', asyncHandler(getCollectionStats));

// Clear cache
router.delete('/system/cache/:collectionName?', asyncHandler(clearCache));

// Preload models
router.post('/system/cache/preload', asyncHandler(preloadModels));

export default router;