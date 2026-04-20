import { Request, Response } from 'express';
import { ImageService } from '../../../application/services/ImageService';
import { FileSystemImageStorage } from '../../../infrastructure/database/FileSystemImageStorage';
import { ResponseHandler } from '../../../shared/utils/responseHandler';
import { getRequestHost, getRequestProtocol } from '../../../shared/utils/requestUrl';

export class ImageController {
  private imageService: ImageService;

  constructor() {
    const imageStorage = new FileSystemImageStorage();
    this.imageService = new ImageService(imageStorage);
  }

  async uploadImage(req: Request, res: Response) {
    try {
      const { imageBase64 } = req.body;
      const requestInfo = { protocol: getRequestProtocol(req), host: getRequestHost(req) };
      const result = await this.imageService.uploadImage(imageBase64, requestInfo);
      ResponseHandler.success(res, result);
    } catch (error) {
      ResponseHandler.error(res, error);
    }
  }

  async uploadMultipleImages(req: Request, res: Response) {
    try {
      const { imagesBase64 } = req.body;
      const requestInfo = { protocol: getRequestProtocol(req), host: getRequestHost(req) };
      const result = await this.imageService.uploadMultipleImages(imagesBase64, requestInfo);
      ResponseHandler.success(res, result);
    } catch (error) {
      ResponseHandler.error(res, error);
    }
  }

}