import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ResponseHandler } from '../../../shared/utils/responseHandler';
import { getRequestBaseUrl } from '../../../shared/utils/requestUrl';

export const uploadImage = (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) return ResponseHandler.badRequest(res, 'No image data provided');

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const imageBuffer = Buffer.from(base64Data, 'base64');
    const filename = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;

    const uploadsDir = path.join(process.cwd(), 'storage/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, imageBuffer);

    const baseUrl = getRequestBaseUrl(req);
    const imageUrl = `/uploads/${filename}`;
    const fullUrl = `${baseUrl}${imageUrl}`;

    ResponseHandler.success(
      res,
      { url: fullUrl },
      'Image uploaded successfully',
      201
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    ResponseHandler.error(res, error);
  }
};

export const uploadMultipleImages = (req: Request, res: Response) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return ResponseHandler.badRequest(res, 'No images provided');
    }

    const uploadsDir = path.join(process.cwd(), 'storage/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imageUrls = images.map((imageBase64: string, index: number) => {

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const filename = `image-${Date.now()}-${index}-${Math.round(Math.random() * 1E9)}.png`;

      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, imageBuffer);

      const baseUrl = getRequestBaseUrl(req);
      const imageUrl = `/uploads/${filename}`;
      return {
        url: imageUrl,
        fullUrl: `${baseUrl}${imageUrl}`
      };
    });

    ResponseHandler.success(
      res,
      { urls: imageUrls },
      'Images uploaded successfully',
      201
    );
  } catch (error) {
    console.error('Error uploading images:', error);
    ResponseHandler.error(res, error);
  }
};

export const proxyImage = (req: Request, res: Response) => {
  res.status(501).json({ message: 'Proxy image not implemented yet' });
};

export class ImageController {
  uploadImage = uploadImage;
  uploadMultipleImages = uploadMultipleImages;
  proxyImage = proxyImage;
}