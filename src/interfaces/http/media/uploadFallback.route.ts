import { Express, Request, Response } from 'express';
import path from 'path';
import { renderFileNotAvailablePage } from '../../../shared/utils/fileNotAvailablePage';

export const registerUploadFallbackRoute = (app: Express): void => {
  app.use('/uploads', (req: Request, res: Response) => {
    const fileName = path.basename(req.path);
    res.status(404).send(renderFileNotAvailablePage(fileName));
  });
};
