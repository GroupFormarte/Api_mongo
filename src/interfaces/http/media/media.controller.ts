import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { ResponseHandler } from '../../../shared/utils/responseHandler';

export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image } = req.body;

    if (!image) {
      return ResponseHandler.badRequest(res, 'No image data provided');
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const filename = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;

    const uploadsDir = path.join(process.cwd(), 'storage/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadsDir, filename), imageBuffer);

    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

    return ResponseHandler.success(res, { url: fullUrl }, 'Image uploaded successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const uploadMultipleImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return ResponseHandler.badRequest(res, 'No images provided');
    }

    const uploadsDir = path.join(process.cwd(), 'storage/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const imageUrls = images.map((imageBase64: string, index: number) => {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const filename = `image-${Date.now()}-${index}-${Math.round(Math.random() * 1E9)}.png`;
      fs.writeFileSync(path.join(uploadsDir, filename), imageBuffer);
      return {
        url: `/uploads/${filename}`,
        fullUrl: `${baseUrl}/uploads/${filename}`
      };
    });

    return ResponseHandler.success(res, { urls: imageUrls }, 'Images uploaded successfully', 201);
  } catch (error) {
    return next(error);
  }
};
