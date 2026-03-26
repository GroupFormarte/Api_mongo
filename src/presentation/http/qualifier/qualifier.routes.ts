import express from 'express';
import multer from 'multer';
import { uploadFile, uploadFileExcel } from './qualifier.controller';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router
    .post('/upload', upload.single('file'), uploadFile)
    .post('/excel', upload.single('file'), uploadFileExcel)
    
export default router;