const fs = require('fs/promises');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { parse } = require('csv-parse/sync');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const repository = require('./repository');
const { cleanText, summarizeFallback } = require('../utils/text');
const { chunkText } = require('../utils/chunking');
const { generateEmbedding } = require('./ollamaService');
const { detectFileType } = require('../utils/file');
const httpError = require('../utils/httpError');

async function extractImageText(filePath) {
  const image = await sharp(filePath)
    .grayscale()
    .normalize()
    .resize({ width: 2000, withoutEnlargement: true })
    .png()
    .toBuffer();
  const result = await Tesseract.recognize(image, 'eng');
  return result.data.text;
}

async function extractTextFromFile({ filePath, originalName, mimeType }) {
  const fileType = detectFileType(originalName, mimeType);
  if (!fileType) throw httpError(400, 'Unsupported file type');

  if (fileType === 'pdf') {
    const result = await pdfParse(await fs.readFile(filePath));
    return { text: result.text, pageCount: result.numpages };
  }
  if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return { text: result.value, pageCount: 0 };
  }
  if (fileType === 'csv') {
    const rows = parse(await fs.readFile(filePath, 'utf8'), { skip_empty_lines: true });
    return { text: rows.map((row) => row.join('\t')).join('\n'), pageCount: 0 };
  }
  if (fileType === 'image') {
    return { text: await extractImageText(filePath), pageCount: 0 };
  }
  return { text: await fs.readFile(filePath, 'utf8'), pageCount: 0 };
}

async function processDocument(document, filePath) {
  await repository.updateById('documents', document.id, { status: 'processing', processingError: '' });
  try {
    const extracted = await extractTextFromFile({
      filePath,
      originalName: document.originalName,
      mimeType: document.mimeType
    });
    const text = cleanText(extracted.text);
    if (text.length < 30) {
      throw httpError(400, 'The file does not contain enough readable text to process');
    }
    const chunks = chunkText(text);
    for (const chunk of chunks) {
      await repository.create('documentChunks', {
        userId: document.userId,
        workspaceId: document.workspaceId,
        documentId: document.id,
        ...chunk,
        embedding: await generateEmbedding(chunk.text)
      });
    }
    return await repository.updateById('documents', document.id, {
      status: 'ready',
      extractedText: text,
      summary: summarizeFallback(text),
      pageCount: extracted.pageCount || 0,
      metadata: { chunkCount: chunks.length },
      processingError: ''
    });
  } catch (error) {
    await repository.deleteWhere('documentChunks', {
      userId: document.userId,
      workspaceId: document.workspaceId,
      documentId: document.id
    });
    return repository.updateById('documents', document.id, {
      status: 'failed',
      processingError: error.message || 'Document processing failed'
    });
  }
}

module.exports = {
  extractTextFromFile,
  processDocument
};
