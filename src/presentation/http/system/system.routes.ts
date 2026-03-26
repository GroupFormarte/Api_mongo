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
  .post('/system/cache/preload', asyncHandler(preloadModels))
  .get('/system/cache/stats', asyncHandler(getCacheStats))
  .get('/system/collections/:collectionName/stats', asyncHandler(getCollectionStats))
  .delete('/system/cache/:collectionName?', asyncHandler(clearCache));

router
  .post('/:collectionName/bulk', asyncHandler(getDocumentsByIdsBulk));

router
  .get('/:collectionName/search/:field/:value', asyncHandler(searchDocumentsByField))
  .get('/:collectionName/multi-search/:query', asyncHandler(multiFieldSearch))
  .get('/:collectionName/category/:category', asyncHandler(searchByCategory));

router
  .patch('/assigned_simulation/:id/simulacro/:simulacroId/resultados', asyncHandler(updateAssignedSimulationResults))
  .patch('/assigned_simulation/:id/simulacro/:simulacroId/session-details', asyncHandler(updateAssignedSimulationSessionDetails))
  .patch('/assigned_simulation/:documentId/simulacro/:simulacroId/student/:userId', asyncHandler(updateOrCreateStudentAnswers));

router
  .post('/:collectionName/:id?', asyncHandler(createDocument))
  .get('/:collectionName', asyncHandler(getAllDocuments))
  .get('/:collectionName/:id', asyncHandler(getDocumentById))
  .put('/:collectionName/:id', asyncHandler(updateDocumentById))
  .patch('/:collectionName/:id', asyncHandler(partialUpdateDocumentById))
  .delete('/:collectionName/:id', asyncHandler(deleteDocumentById));

export default router;