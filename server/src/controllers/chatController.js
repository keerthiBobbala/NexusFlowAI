const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const repository = require('../services/repository');
const { runWorkflow } = require('../services/pipelineService');

async function getOwnedWorkspace(workspaceId, userId) {
  const workspace = await repository.getById('workspaces', workspaceId);
  if (!workspace || workspace.userId !== userId) throw httpError(404, 'Workspace not found');
  return workspace;
}

async function getOwnedThread(threadId, userId, workspaceId) {
  const thread = await repository.getById('chatThreads', threadId);
  if (!thread || thread.userId !== userId || thread.workspaceId !== workspaceId) {
    throw httpError(404, 'Thread not found');
  }
  return thread;
}

const getWorkspaceChatInfo = asyncHandler(async (req, res) => {
  const workspace = await getOwnedWorkspace(req.params.workspaceId, req.user.id);
  const threads = await repository.getAll(
    'chatThreads',
    { userId: req.user.id, workspaceId: workspace.id },
    { updatedAt: -1 }
  );
  res.json({ threads });
});

const getThreadMessages = asyncHandler(async (req, res) => {
  await getOwnedWorkspace(req.params.workspaceId, req.user.id);
  const thread = await getOwnedThread(req.params.threadId, req.user.id, req.params.workspaceId);
  const messages = await repository.getAll(
    'chatMessages',
    { userId: req.user.id, workspaceId: req.params.workspaceId, threadId: thread.id },
    { createdAt: 1 }
  );
  res.json({ messages });
});

const askWorkspaceQuestion = asyncHandler(async (req, res) => {
  const question = typeof req.body.question === 'string' ? req.body.question.trim() : '';
  if (!question) throw httpError(400, 'Enter a question before sending');
  const workspace = await getOwnedWorkspace(req.params.workspaceId, req.user.id);
  let thread;
  if (req.body.threadId) {
    thread = await getOwnedThread(req.body.threadId, req.user.id, workspace.id);
  } else {
    thread = await repository.create('chatThreads', {
      userId: req.user.id,
      workspaceId: workspace.id,
      title: question.slice(0, 80)
    });
  }

  const userMessage = await repository.create('chatMessages', {
    userId: req.user.id,
    workspaceId: workspace.id,
    threadId: thread.id,
    role: 'user',
    content: question,
    citations: []
  });
  await repository.updateById('chatThreads', thread.id, { updatedAt: new Date() });

  const run = await runWorkflow({
    userId: req.user.id,
    workspaceId: workspace.id,
    type: 'ask',
    title: `Chat: ${question.slice(0, 60)}`,
    input: { question, threadId: thread.id }
  });
  const assistantMessage = await repository.create('chatMessages', {
    userId: req.user.id,
    workspaceId: workspace.id,
    threadId: thread.id,
    role: 'assistant',
    content: run.output.answer,
    citations: run.citations
  });

  res.status(201).json({ thread, userMessage, assistantMessage, run });
});

module.exports = {
  getWorkspaceChatInfo,
  getThreadMessages,
  askWorkspaceQuestion
};
