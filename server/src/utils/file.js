const fs = require('fs/promises');
const path = require('path');

const allowedExtensions = {
  pdf: ['.pdf'],
  docx: ['.docx'],
  txt: ['.txt'],
  md: ['.md'],
  csv: ['.csv'],
  image: ['.png', '.jpg', '.jpeg', '.webp']
};

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/csv',
  'text/csv;charset=utf-8'
]);

function detectFileType(originalName = '', mimeType = '') {
  const extension = path.extname(originalName).toLowerCase();
  const matchingType = Object.entries(allowedExtensions).find(([, extensions]) => extensions.includes(extension));
  if (matchingType) return matchingType[0];

  const normalizedMimeType = mimeType.split(';')[0].trim().toLowerCase();
  const mimeTypes = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
    'text/markdown': 'md',
    'text/csv': 'csv',
    'application/csv': 'csv',
    'image/png': 'image',
    'image/jpeg': 'image',
    'image/webp': 'image'
  };
  return mimeTypes[normalizedMimeType] || null;
}

function isAllowedUpload(originalName, mimeType) {
  const type = detectFileType(originalName, mimeType);
  const normalizedMimeType = mimeType.split(';')[0].trim().toLowerCase();
  const acceptedMimeTypes = new Set(allowedMimeTypes);
  acceptedMimeTypes.add('application/octet-stream');
  return Boolean(type && acceptedMimeTypes.has(normalizedMimeType));
}

function ensureDir(dirPath) {
  return fs.mkdir(dirPath, { recursive: true });
}

function uploadsRoot() {
  return path.join(__dirname, '..', '..', 'uploads');
}

function getWorkspaceUploadDir({ userId, workspaceId }) {
  // Return the absolute path where files for a specific workspace are stored.
  // Example: <repo>/uploads/<userId>/<workspaceId>
  return path.join(uploadsRoot(), String(userId), String(workspaceId));
}

function getStoredFilePath({ userId, workspaceId, storedName }) {
  // Construct the full path to a stored file within a workspace.
  return path.join(getWorkspaceUploadDir({ userId, workspaceId }), storedName);
}

async function safeDeleteFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function safeDeleteDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: false });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function buildStoredName(originalName = '') {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension);
  const slug = baseName
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'upload';
  return `${slug}-${Date.now()}${extension}`;
}

module.exports = {
  detectFileType,
  isAllowedUpload,
  ensureDir,
  uploadsRoot,
  getWorkspaceUploadDir,
  getStoredFilePath,
  safeDeleteFile,
  safeDeleteDir,
  buildStoredName
};
