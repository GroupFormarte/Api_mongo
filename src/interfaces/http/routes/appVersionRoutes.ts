import { Router, Request, Response } from 'express';
import { DynamicRepository } from '../../../infrastructure/repositories/DynamicRepository';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import ApiResponse from '../../../shared/utils/ApiResponse';

const router = Router();
const repository = new DynamicRepository();
const COLLECTION_NAME = 'version';

// ================================================
// APP VERSION MANAGEMENT (Single Document)
// ================================================

/**
 * Get current app version
 * GET /api/version
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // Get all documents from version collection (should only be one)
  const versions = await repository.find(COLLECTION_NAME);

  if (!versions || versions.length === 0) {
    return ApiResponse.notFound(res, 'Versión no encontrada en la base de datos');
  }

  // Return the first (and should be only) version document
  const currentVersion = versions[0];

  return ApiResponse.success(res, currentVersion, 'Version retrieved successfully');
}));

/**
 * Create app version (first time)
 * POST /api/version
 * Body: {
 *   version: "1.0.0",
 *   buildNumber: "100",
 *   releaseDate: "2025-01-10T00:00:00.000Z",
 *   forceUpdate: false,
 *   updateMessage: "Nueva versión disponible"
 * }
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body.data;

  console.log({data});
  
  // Validate required fields
  if (!data.version || !data.buildNumber) {
    return ApiResponse.badRequest(res, 'version and buildNumber are required');
  }

  // Check if version already exists
  const existingVersions = await repository.find(COLLECTION_NAME);
  if (existingVersions && existingVersions.length > 0) {
    return ApiResponse.badRequest(res, 'Version already exists. Use PUT to update it.');
  }

  // Set default values
  const versionData = {
    version: data.version,
    buildNumber: data.buildNumber,
    releaseDate: data.releaseDate || new Date().toISOString(),
    forceUpdate: data.forceUpdate || false,
    updateMessage: data.updateMessage || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const newVersion = await repository.create(COLLECTION_NAME, versionData);

  return ApiResponse.created(res, newVersion, 'Version created successfully');
}));

/**
 * Update app version
 * PUT /api/version
 * Body: {
 *   version: "1.0.1",
 *   buildNumber: "101",
 *   releaseDate: "2025-01-10T00:00:00.000Z",
 *   forceUpdate: true,
 *   updateMessage: "Actualización importante"
 * }
 */
router.put('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  // Validate required fields
  if (!data.version || !data.buildNumber) {
    return ApiResponse.badRequest(res, 'version and buildNumber are required');
  }

  // Get existing version document
  const existingVersions = await repository.find(COLLECTION_NAME);

  if (!existingVersions || existingVersions.length === 0) {
    return ApiResponse.notFound(res, 'No version found to update. Use POST to create one first.');
  }

  const existingVersion = existingVersions[0];
  const versionId = existingVersion._id.toString();

  // Update data
  const updateData = {
    version: data.version,
    buildNumber: data.buildNumber,
    releaseDate: data.releaseDate || new Date().toISOString(),
    forceUpdate: data.forceUpdate !== undefined ? data.forceUpdate : false,
    updateMessage: data.updateMessage || null,
    updatedAt: new Date().toISOString()
  };

  const updatedVersion = await repository.updateById(COLLECTION_NAME, versionId, updateData);

  if (!updatedVersion) {
    return ApiResponse.notFound(res, 'Failed to update version');
  }

  return ApiResponse.updated(res, updatedVersion, 'Version updated successfully');
}));

export default router;
