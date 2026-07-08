import { readFileSync } from 'fs';
import { extname } from 'path';

export async function parseFile(filePath: string, originalName: string): Promise<string> {
  const ext = extname(originalName).toLowerCase();

  switch (ext) {
    case '.md':
      return readFileSync(filePath, 'utf-8');

    case '.txt':
      return readFileSync(filePath, 'utf-8');

    case '.pdf':
      return await parsePdf(filePath);

    case '.docx':
      return await parseDocx(filePath);

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

async function parsePdf(filePath: string): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDocx(filePath: string): Promise<string> {
  const mammoth = await import('mammoth');
  const buffer = readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
