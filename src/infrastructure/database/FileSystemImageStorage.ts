import fs from 'fs';
import path from 'path';
import { ImageStoragePort } from '../../application/services/ImageService';
import { ImageMetadata } from '../../domain/entities/ImageEntity';
import { env } from '../../shared/config/env';

export class FileSystemImageStorage implements ImageStoragePort {
  private readonly uploadsDir: string;

  constructor() {
    this.uploadsDir = env.uploadPath;
    this.ensureUploadsDirectory();
  }
  private ensureUploadsDirectory(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }
  async saveImage(
    imageBuffer: Buffer, 
    metadata: ImageMetadata, 
    requestInfo: { protocol: string; host: string }
  ): Promise<{ url: string; fullUrl: string }> {
    const filepath = path.join(this.uploadsDir, metadata.filename);
    await fs.promises.writeFile(filepath, imageBuffer);

    const baseUrl = `${requestInfo.protocol}://${requestInfo.host}`;
    return {
      url: `${baseUrl}/uploads/${metadata.filename}`,
      fullUrl: `${baseUrl}/uploads/${metadata.filename}`
    };
  }

  async saveMultipleImages(
    images: Array<{ buffer: Buffer; metadata: ImageMetadata }>,
    requestInfo: { protocol: string; host: string }
  ): Promise<Array<{ url: string; fullUrl: string }>> {
    return Promise.all(
      images.map(({ buffer, metadata }) => this.saveImage(buffer, metadata, requestInfo))
    );
  }
}