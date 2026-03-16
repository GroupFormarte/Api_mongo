import { Request, Response } from 'express';
import xlsx from 'xlsx';
import { processFileWithRoute } from '../../../shared/utils/fileReader';
import { ResponseHandler } from '../../../shared/utils/responseHandler';

export const uploadFile = (req: Request, res: Response) => {
  try {
    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded or file data missing' });
    }
    const buffer = Buffer.from(file, 'base64');
    const data = buffer.toString('utf-8');
    const processedData = processFileWithRoute(data);
    ResponseHandler.success(res, processedData, 'File processed successfully');
  } catch (error) {
    ResponseHandler.error(res, error);
  }
};


export const uploadFileExcel = (req: Request, res: Response) => {
  try {
    const { file } = req.body;

    if (!file) return res.status(400).json({ message: 'No file uploaded or file data missing' });
    
    const buffer = Buffer.from(file, 'base64');
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    // Procesar todas las hojas y convertirlas en un único listado
    const sheets = workbook.SheetNames;
    const flattenedList: any[] = [];

    sheets.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = xlsx.utils.sheet_to_json(sheet);

      // Transformar las claves de cada objeto
      const transformedData = sheetData.map((row: any) => {
        const transformedRow: any = {};
        Object.keys(row).forEach((key) => {
          const transformedKey = key
            .toLowerCase()
            .replace(/\s+/g, '_');
          transformedRow[transformedKey] = row[key];
        });
        return transformedRow;
      });

      flattenedList.push(...transformedData);
    });

    ResponseHandler.success(res, flattenedList, 'File processed successfully');
  } catch (error) {
    ResponseHandler.error(res, error);
  }
};
