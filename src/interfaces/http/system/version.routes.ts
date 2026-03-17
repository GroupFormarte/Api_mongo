import { Router, Request, Response } from 'express';
import { DynamicRepository } from '../../../infrastructure/repositories/DynamicRepository';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import ApiResponse from '../../../shared/utils/ApiResponse';

const router = Router();
const repository = new DynamicRepository();
const COLLECTION_NAME = 'version';

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const versions = await repository.find(COLLECTION_NAME);

  if (!versions || versions.length === 0) {
    return ApiResponse.notFound(res, 'Versión no encontrada en la base de datos');
  }

  // Return the first (and should be only) version document
  const currentVersion = versions[0];

  return ApiResponse.success(res, currentVersion, 'Version retrieved successfully');
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body.data;

  if (!data.version || !data.buildNumber) {
    return ApiResponse.badRequest(res, 'version and buildNumber are required');
  }

  const existingVersions = await repository.find(COLLECTION_NAME);
  if (existingVersions && existingVersions.length > 0) {
    return ApiResponse.badRequest(res, 'Version already exists. Use PUT to update it.');
  }

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


router.put('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  if (!data.version || !data.buildNumber) {
    return ApiResponse.badRequest(res, 'version and buildNumber are required');
  }

  const existingVersions = await repository.find(COLLECTION_NAME);

  if (!existingVersions || existingVersions.length === 0) {
    return ApiResponse.notFound(res, 'No version found to update. Use POST to create one first.');
  }

  const existingVersion = existingVersions[0];
  const versionId = existingVersion._id.toString();

  const updateData = {
    version: data.version,
    buildNumber: data.buildNumber,
    releaseDate: data.releaseDate || new Date().toISOString(),
    forceUpdate: data.forceUpdate !== undefined ? data.forceUpdate : false,
    updateMessage: data.updateMessage || null,
    updatedAt: new Date().toISOString()
  };

  const updatedVersion = await repository.updateById(COLLECTION_NAME, versionId, updateData);
  if (!updatedVersion) return ApiResponse.notFound(res, 'Failed to update version');

  return ApiResponse.updated(res, updatedVersion, 'Version updated successfully');
}));

export default router;
