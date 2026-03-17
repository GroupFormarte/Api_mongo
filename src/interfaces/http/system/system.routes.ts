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

router
  .post('/:collectionName/:id?', asyncHandler(createDocument))
  .post('/:collectionName/bulk', asyncHandler(getDocumentsByIdsBulk))
  .post('/system/cache/preload', asyncHandler(preloadModels))

  .get('/:collectionName/search/:field/:value', asyncHandler(searchDocumentsByField))
  .get('/:collectionName/multi-search/:query', asyncHandler(multiFieldSearch))
  .get('/:collectionName/category/:category', asyncHandler(searchByCategory))
  .get('/:collectionName', asyncHandler(getAllDocuments))
  .get('/:collectionName/:id', asyncHandler(getDocumentById))
  .get('/system/cache/stats', asyncHandler(getCacheStats))
  .get('/system/collections/:collectionName/stats', asyncHandler(getCollectionStats))

  .put('/:collectionName/:id', asyncHandler(updateDocumentById))

  .patch('/:collectionName/:id', asyncHandler(partialUpdateDocumentById))
  .patch('/assigned_simulation/:id/simulacro/:simulacroId/resultados', asyncHandler(updateAssignedSimulationResults))
  .patch('/assigned_simulation/:id/simulacro/:simulacroId/session-details', asyncHandler(updateAssignedSimulationSessionDetails))
  .patch('/assigned_simulation/:documentId/simulacro/:simulacroId/student/:userId', asyncHandler(updateOrCreateStudentAnswers))

  .delete('/:collectionName/:id', asyncHandler(deleteDocumentById))
  .delete('/system/cache/:collectionName?', asyncHandler(clearCache))

export default router;