const express = require('express');
const auth = require('../middleware/auth');
const workspaceController = require('../controllers/workspaceController');
const documentController = require('../controllers/documentController');
const chatController = require('../controllers/chatController');
const runController = require('../controllers/runController');
const multer = require('multer');
const path = require('path');
const { isAllowedUpload } = require('../utils/file');
const httpError = require('../utils/httpError');
const fs = require('fs');

const router = express.Router();
const tmpDir = path.join(__dirname, '..', '..', 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });
const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (isAllowedUpload(file.originalname, file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(httpError(400, 'Unsupported file type'));
  }
});

router.use(auth);

router.get('/:workspaceId/documents', documentController.listWorkspaceDocuments);
router.post('/:workspaceId/documents/upload', upload.single('file'), documentController.uploadDocument);

router.get('/:workspaceId/chat', chatController.getWorkspaceChatInfo);
router.get('/:workspaceId/chat/:threadId/messages', chatController.getThreadMessages);
router.post('/:workspaceId/chat', chatController.askWorkspaceQuestion);

router.get('/:workspaceId/runs', runController.listWorkspaceRuns);
router.post('/:workspaceId/runs/summarize', runController.summarizeWorkspace);
router.post('/:workspaceId/runs/compare', runController.compareDocuments);
router.post('/:workspaceId/runs/meeting-action-items', runController.meetingActionItems);
router.post('/:workspaceId/runs/research-brief', runController.researchBrief);

router.get('/', workspaceController.listWorkspaces);
router.post('/', workspaceController.createWorkspace);
router.get('/:id', workspaceController.getWorkspaceById);
router.patch('/:id', workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

module.exports = router;
