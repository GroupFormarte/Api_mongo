import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DynamicRepository } from '../../../infrastructure/repositories/DynamicRepository';
import ApiResponse from '../../../shared/utils/ApiResponse';

const repository = new DynamicRepository();

export const getDocumentsByIdsBulk = async (req: Request, res: Response) => {
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
};

export const searchDocumentsByField = async (req: Request, res: Response) => {
  const { collectionName, field, value } = req.params;

  const documents = await repository.searchByField(collectionName, field, value);

  if (documents.length === 0) {
    return ApiResponse.notFound(res, `No se encontraron documentos para el campo "${field}" con el valor "${value}"`);
  }

  return ApiResponse.success(res, documents, 'Search results retrieved successfully');
};

export const multiFieldSearch = async (req: Request, res: Response) => {
  const { collectionName, query } = req.params;
  const fields = req.query.fields ? (req.query.fields as string).split(',') : [];

  if (fields.length === 0) {
    return ApiResponse.badRequest(res, 'Se requiere al menos un campo en el parametro "fields"');
  }

  const documents = await repository.multiFieldSearch(collectionName, query, fields);
  return ApiResponse.success(res, documents, 'Multi-field search completed successfully');
};

export const searchByCategory = async (req: Request, res: Response) => {
  const { collectionName, category } = req.params;

  const documents = await repository.findByCategory(collectionName, category);
  return ApiResponse.success(res, documents, 'Category search completed successfully');
};

export const getAllDocuments = async (req: Request, res: Response) => {
  const { collectionName } = req.params;
  const page = parseInt(req.query.page as string) || 1;

  const documents = await repository.find(collectionName);
  const limit = parseInt(req.query.limit as string) || documents.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedResult = documents.slice(startIndex, endIndex);
  void paginatedResult;

  return ApiResponse.success(res, documents, 'Students retrieved successfully');
};

export const getDocumentById = async (req: Request, res: Response) => {
  const { collectionName, id } = req.params;

  const document = await repository.findById(collectionName, id);
  if (!document) {
    return ApiResponse.notFound(res, 'Documento no encontrado');
  }

  return ApiResponse.success(res, document, 'Document retrieved successfully');
};

export const createDocument = async (req: Request, res: Response) => {
  const { collectionName, id } = req.params;
  const schemaDefinition = req.body.schema || {};
  const data = req.body.data || req.body;

  const idAux = id ?? data.id_student;
  const documentData = idAux ? { ...data, id: idAux } : data;

  const document = await repository.create(collectionName, documentData, schemaDefinition);
  return ApiResponse.created(res, document, 'Document created successfully');
};

export const updateAssignedSimulationResults = async (req: Request, res: Response) => {
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
};

export const updateAssignedSimulationSessionDetails = async (req: Request, res: Response) => {
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
};

export const updateDocumentById = async (req: Request, res: Response) => {
  const { collectionName, id } = req.params;
  const data = req.body;

  const document = await repository.updateById(collectionName, id, data);
  if (!document) {
    return ApiResponse.notFound(res, 'Documento no encontrado');
  }

  return ApiResponse.updated(res, document, 'Document updated successfully');
};

export const updateOrCreateStudentAnswers = async (req: Request, res: Response) => {
  const { documentId, simulacroId } = req.params;
  const flatData = req.body;

  if (!flatData || Object.keys(flatData).length === 0) {
    return ApiResponse.badRequest(res, 'Se requiere data en el body');
  }

  if (!flatData.sectionOne && !flatData.sectionTwo) {
    return ApiResponse.badRequest(res, 'Se requiere al menos sectionOne o sectionTwo');
  }

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

  return ApiResponse.updated(res, {
    success: true,
    userId: flatData.userId,
    message: 'Student answers updated successfully'
  }, 'Student answers updated successfully');
};

export const partialUpdateDocumentById = async (req: Request, res: Response) => {
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
};

export const deleteDocumentById = async (req: Request, res: Response) => {
  const { collectionName, id } = req.params;

  const document = await repository.deleteById(collectionName, id);
  if (!document) {
    return ApiResponse.notFound(res, 'Documento no encontrado');
  }

  return ApiResponse.deleted(res, 'Document deleted successfully');
};

export const getCacheStats = async (req: Request, res: Response) => {
  const stats = await repository.getCacheStats();
  return ApiResponse.success(res, stats, 'Cache statistics retrieved successfully');
};

export const getCollectionStats = async (req: Request, res: Response) => {
  const { collectionName } = req.params;
  const stats = await repository.getCollectionStats(collectionName);
  return ApiResponse.success(res, stats, 'Collection statistics retrieved successfully');
};

export const clearCache = async (req: Request, res: Response) => {
  const { collectionName } = req.params;

  await repository.invalidateCache(collectionName);

  const message = collectionName
    ? `Cache cleared for collection: ${collectionName}`
    : 'All cache cleared successfully';

  return ApiResponse.success(res, null, message);
};

export const preloadModels = async (req: Request, res: Response) => {
  const { collections } = req.body;

  if (!Array.isArray(collections)) {
    return ApiResponse.badRequest(res, 'Se requiere un array de colecciones');
  }

  await repository.preloadModels(collections);
  return ApiResponse.success(res, null, 'Models preloaded successfully');
};
