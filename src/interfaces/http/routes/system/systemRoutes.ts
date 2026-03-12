import { Router, Request, Response } from 'express';
import { DynamicRepository } from '../../../../infrastructure/repositories/DynamicRepository';
import { asyncHandler } from '../../../../shared/middleware/errorHandler';
import ApiResponse from '../../../../shared/utils/ApiResponse';
import mongoose from 'mongoose';

const router = Router();
const repository = new DynamicRepository();

// GENERIC CRUD OPERATIONS

// Get documents by IDs in bulk (generic)
router.post('/:collectionName/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName } = req.params;
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, 'Se requiere un array "ids" con al menos un elemento');
  }

  const documents = await repository.findByIds(collectionName, ids);

  if (!documents || documents.length === 0) {
    return ApiResponse.notFound(res, 'No se encontraron documentos para los IDs especificados');
  }

  return ApiResponse.success(res, documents, 'Documents retrieved successfully');
}));


// Search documents by dynamic field
router.get('/:collectionName/search/:field/:value', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName, field, value } = req.params;

  const documents = await repository.searchByField(collectionName, field, value);

  if (documents.length === 0) {
    return ApiResponse.notFound(res, `No se encontraron documentos para el campo "${field}" con el valor "${value}"`);
  }

  return ApiResponse.success(res, documents, 'Search results retrieved successfully');
}));

// Multi-field search
router.get('/:collectionName/multi-search/:query', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName, query } = req.params;
  const fields = req.query.fields ? (req.query.fields as string).split(',') : [];

  if (fields.length === 0) {
    return ApiResponse.badRequest(res, 'Se requiere al menos un campo en el parámetro "fields"');
  }

  const documents = await repository.multiFieldSearch(collectionName, query, fields);
  return ApiResponse.success(res, documents, 'Multi-field search completed successfully');
}));

// Search by category
router.get('/:collectionName/category/:category', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName, category } = req.params;

  const documents = await repository.findByCategory(collectionName, category);
  return ApiResponse.success(res, documents, 'Category search completed successfully');
}));

// Get all documents from a collection
router.get('/:collectionName', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName } = req.params;
  const page = parseInt(req.query.page as string) || 1;

  const documents = await repository.find(collectionName);
  const limit = parseInt(req.query.limit as string) || documents.length;
  // Simple pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedResult = documents.slice(startIndex, endIndex);
  return ApiResponse.success(res, documents, 'Students retrieved successfully');
  // return ApiResponse.paginated(res, paginatedResult, page, limit, documents.length, 'Documents retrieved successfully');
}));

// Get document by ID
router.get('/:collectionName/:id', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName, id } = req.params;

  const document = await repository.findById(collectionName, id);
  if (!document) {
    return ApiResponse.notFound(res, 'Documento no encontrado');
  }

  return ApiResponse.success(res, document, 'Document retrieved successfully');
}));

// Create document
router.post('/:collectionName/:id?', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName, id } = req.params;
  const schemaDefinition = req.body.schema || {};
  const data = req.body.data || req.body;

  const idAux = id ?? data.id_student;
  const documentData = idAux ? { ...data, id: idAux } : data;

  const document = await repository.create(collectionName, documentData, schemaDefinition);
  return ApiResponse.created(res, document, 'Document created successfully');
}));

router.patch('/assigned_simulation/:id/simulacro/:simulacroId/resultados',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, simulacroId } = req.params;
    const { resultados, mergeByUserId } = req.body;

    if (!Array.isArray(resultados)) {
      return ApiResponse.badRequest(res, 'Se requiere resultados[] en el body');
    }

    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB no conectado');

    let finalResultados = resultados;

    if (mergeByUserId) {
      const doc = await db.collection('assigned_simulation').findOne(
        { _id: new mongoose.Types.ObjectId(id) }
      );

      if (doc) {
        const simulacro = (doc.simulacros_asignados as any[])
          .find((s: any) => s.id_simulacro === simulacroId);

        if (simulacro) {
          const uploadedIds = new Set(resultados.map((r: any) => r.userId?.toString().trim()));
          const uploadedDocs = new Set(
            resultados
              .map((r: any) => r.document_user?.toString().trim())
              .filter(Boolean)
          );

          const otherResults = (simulacro.resultados_estudiantes ?? []).filter((existing: any) => {
            const existingId = existing.userId?.toString().trim();
            const existingDoc = existing.document_user?.toString().trim();
            return !uploadedIds.has(existingId) &&
              !(existingDoc && uploadedDocs.has(existingDoc));
          });

          finalResultados = [...otherResults, ...resultados];
        }
      }
    }

    const doc = await db.collection('assigned_simulation').findOne(
      { _id: new mongoose.Types.ObjectId(id) }
    );

    if (!doc) return ApiResponse.notFound(res, 'Documento no encontrado');

    const simulacros = doc.simulacros_asignados as any[];
    const firstIndex = simulacros.findIndex((s: any) => s.id_simulacro === simulacroId);

    if (firstIndex === -1) return ApiResponse.notFound(res, 'Simulacro no encontrado');

    const updateKey = `simulacros_asignados.${firstIndex}.resultados_estudiantes`;

    const result = await db.collection('assigned_simulation').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { [updateKey]: finalResultados } }
    );

    return ApiResponse.updated(res, { updated: result.modifiedCount }, 'Resultados actualizados');
  })
);

router.patch('/assigned_simulation/:id/simulacro/:simulacroId/session-details',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, simulacroId } = req.params;
    const { sessionDetails } = req.body;

    if (!sessionDetails) {
      return ApiResponse.badRequest(res, 'Se requiere sessionDetails en el body');
    }

    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB no conectado');

    const result = await db.collection('assigned_simulation').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          'simulacros_asignados.$[elem].sessionDetails': sessionDetails,
        },
      },
      {
        arrayFilters: [{ 'elem.id_simulacro': simulacroId }],
      }
    );

    if (result.matchedCount === 0) return ApiResponse.notFound(res, 'Documento no encontrado');

    return ApiResponse.updated(res, { updated: result.modifiedCount }, 'SessionDetails actualizado');
  })
);

// Update document by ID (full replacement)
router.put('/:collectionName/:id', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName, id } = req.params;
  const data = req.body;

  const document = await repository.updateById(collectionName, id, data);
  if (!document) {
    return ApiResponse.notFound(res, 'Documento no encontrado');
  }

  return ApiResponse.updated(res, document, 'Document updated successfully');
}));

// Update or create student answers by id_instituto (prevents overwriting other students' data)
// Receives flat JSON with student data and answers mixed
// If student doesn't exist: creates it with all data
// If student exists: only updates sectionOne/sectionTwo, ignores other fields
router.patch('/assigned_simulation/:documentId/simulacro/:simulacroId/student/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { documentId, simulacroId, userId } = req.params;
  const flatData = req.body;

  // Validate that required fields are present
  if (!flatData || Object.keys(flatData).length === 0) {
    return ApiResponse.badRequest(res, 'Se requiere data en el body');
  }

  // Check if at least sectionOne or sectionTwo is present
  if (!flatData.sectionOne && !flatData.sectionTwo) {
    return ApiResponse.badRequest(res, 'Se requiere al menos sectionOne o sectionTwo');
  }

  // Use id_instituto from body, fallback to documentId if not provided
  const idInstituto = flatData.id_instituto || documentId;

  const document = await repository.updateOrCreateStudentAnswersByQuery(
    'assigned_simulation',
    'id_instituto',
    idInstituto,
    simulacroId,
    flatData
  );

  if (!document) {
    return ApiResponse.notFound(res, 'Documento o simulacro no encontrado');
  }

  // Return simplified response without full document
  return ApiResponse.updated(res, {
    success: true,
    userId: flatData.userId,
    message: 'Student answers updated successfully'
  }, 'Student answers updated successfully');
}));

// Partial update document by ID (only updates specified fields)
router.patch('/:collectionName/:id', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName, id } = req.params;
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return ApiResponse.badRequest(res, 'Se requiere al menos un campo para actualizar');
  }

  const document = await repository.partialUpdateById(collectionName, id, data);
  if (!document) {
    return ApiResponse.notFound(res, 'Documento no encontrado');
  }

  return ApiResponse.updated(res, document, 'Document partially updated successfully');
}));

// Delete document by ID
router.delete('/:collectionName/:id', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName, id } = req.params;

  const document = await repository.deleteById(collectionName, id);
  if (!document) {
    return ApiResponse.notFound(res, 'Documento no encontrado');
  }

  return ApiResponse.deleted(res, 'Document deleted successfully');
}));

// SYSTEM UTILITIES

// Get cache statistics
router.get('/system/cache/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await repository.getCacheStats();
  return ApiResponse.success(res, stats, 'Cache statistics retrieved successfully');
}));

// Get collection statistics
router.get('/system/collections/:collectionName/stats', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName } = req.params;
  const stats = await repository.getCollectionStats(collectionName);
  return ApiResponse.success(res, stats, 'Collection statistics retrieved successfully');
}));

// Clear cache
router.delete('/system/cache/:collectionName?', asyncHandler(async (req: Request, res: Response) => {
  const { collectionName } = req.params;

  await repository.invalidateCache(collectionName);

  const message = collectionName
    ? `Cache cleared for collection: ${collectionName}`
    : 'All cache cleared successfully';

  return ApiResponse.success(res, null, message);
}));

// Preload models
router.post('/system/cache/preload', asyncHandler(async (req: Request, res: Response) => {
  const { collections } = req.body;

  if (!Array.isArray(collections)) {
    return ApiResponse.badRequest(res, 'Se requiere un array de colecciones');
  }

  await repository.preloadModels(collections);
  return ApiResponse.success(res, null, 'Models preloaded successfully');
}));

export default router;