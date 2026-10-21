const fs = require('fs/promises');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const repository = require('../services/repository');
const { processDocument } = require('../services/ingestionService');
const {
  detectFileType,
  ensureDir,
  getWorkspaceUploadDir,
  safeDeleteFile,
  buildStoredName,
  getStoredFilePath
} = require('../utils/file');

async function getOwnedWorkspace(workspaceId, userId) {
  const workspace = await repository.getById('workspaces', workspaceId);
  if (!workspace || workspace.userId !== userId) throw httpError(404, 'Workspace not found');
  return workspace;
}

async function getOwnedDocument(documentId, userId) {
  const document = await repository.getById('documents', documentId);
  if (!document || document.userId !== userId) throw httpError(404, 'Document not found');
  return document;
}

const listWorkspaceDocuments = asyncHandler(async (req, res) => {
  const workspace = await getOwnedWorkspace(req.params.workspaceId, req.user.id);
  const documents = await repository.getAll(
    'documents',
    { userId: req.user.id, workspaceId: workspace.id },
    { createdAt: -1 }
  );
  res.json({ documents });
});

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, 'Choose a file to upload');

  let storedPath;
  let documentCreated = false;
  try {
    const workspace = await getOwnedWorkspace(req.params.workspaceId, req.user.id);
    const storedName = buildStoredName(req.file.originalname);
    const uploadDir = getWorkspaceUploadDir({ userId: req.user.id, workspaceId: workspace.id });
    await ensureDir(uploadDir);
    storedPath = getStoredFilePath({
      userId: req.user.id,
      workspaceId: workspace.id,
      storedName
    });
    await fs.rename(req.file.path, storedPath);

    const fileType = detectFileType(req.file.originalname, req.file.mimetype);
    const document = await repository.create('documents', {
      userId: req.user.id,
      workspaceId: workspace.id,
      originalName: path.basename(req.file.originalname),
      storedName,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
      fileType,
      status: 'uploaded'
    });
    documentCreated = true;
    const processedDocument = await processDocument(document, storedPath);
    res.status(201).json({ document: processedDocument });
  } catch (error) {
    if (!documentCreated && storedPath) await safeDeleteFile(storedPath);
    await safeDeleteFile(req.file.path);
    throw error;
  }
});

const getDocumentById = asyncHandler(async (req, res) => {
  const document = await getOwnedDocument(req.params.id, req.user.id);
  res.json({ document });
});

const reprocessDocument = asyncHandler(async (req, res) => {
  const document = await getOwnedDocument(req.params.id, req.user.id);
  await repository.deleteWhere('documentChunks', {
    userId: req.user.id,
    workspaceId: document.workspaceId,
    documentId: document.id
  });
  const filePath = getStoredFilePath({
    userId: req.user.id,
    workspaceId: document.workspaceId,
    storedName: document.storedName
  });
  const updatedDocument = await processDocument(document, filePath);
  res.json({ document: updatedDocument });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const document = await getOwnedDocument(req.params.id, req.user.id);
  await repository.deleteWhere('documentChunks', {
    userId: req.user.id,
    workspaceId: document.workspaceId,
    documentId: document.id
  });
  await repository.deleteById('documents', document.id);
  await safeDeleteFile(getStoredFilePath({
    userId: req.user.id,
    workspaceId: document.workspaceId,
    storedName: document.storedName
  }));
  res.json({ deleted: true });
});

module.exports = {
  listWorkspaceDocuments,
  uploadDocument,
  getDocumentById,
  reprocessDocument,
  deleteDocument
};
