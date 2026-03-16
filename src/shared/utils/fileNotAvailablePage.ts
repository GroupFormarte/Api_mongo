import fs from 'fs';
import path from 'path';

const templatePath = path.join(process.cwd(), 'storage/templates/file-not-available.html');
let templateCache: string | null = null;

const getTemplate = (): string => {
  if (templateCache !== null) {
    return templateCache;
  }

  templateCache = fs.readFileSync(templatePath, 'utf8');
  return templateCache;
};

export const renderFileNotAvailablePage = (fileName: string): string => {
  return getTemplate()
    .replace('{{FILE_NAME}}', fileName)
    .replace('{{YEAR}}', new Date().getFullYear().toString());
};
