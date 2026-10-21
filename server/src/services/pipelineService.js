const repository = require('./repository');
const plannerAgent = require('../agents/plannerAgent');
const retrieverAgent = require('../agents/retrieverAgent');
const taskAgent = require('../agents/taskAgent');
const writerAgent = require('../agents/writerAgent');
const evaluatorAgent = require('../agents/evaluatorAgent');
const workflowService = require('./workflowService');

function makeTraceEntry(step, status, detail) {
  return {
    step,
    status,
    detail,
    at: new Date().toISOString()
  };
}

async function runWorkflow({ userId, workspaceId, type, title, input = {}, selectedDocumentIds = [] }) {
  const run = await repository.create('workflowRuns', {
    userId,
    workspaceId,
    type,
    status: 'queued',
    title: title || type.replace(/_/g, ' '),
    input: { ...input, ...(selectedDocumentIds.length ? { documentIds: selectedDocumentIds } : {}) },
    output: {},
    citations: [],
    evaluation: {},
    trace: [makeTraceEntry('queued', 'completed', { type })]
  });
  const trace = [...run.trace];
  const recordStep = async (step, status, detail) => {
    trace.push(makeTraceEntry(step, status, detail));
    await repository.updateById('workflowRuns', run.id, { trace });
  };

  try {
    await repository.updateById('workflowRuns', run.id, { status: 'running' });
    const planner = plannerAgent({ type, input, selectedDocumentIds });
    await recordStep('planner', 'completed', { query: planner.query, selectedDocumentIds });

    const retrieved = await retrieverAgent({
      userId,
      workspaceId,
      query: planner.query,
      selectedDocumentIds: planner.selectedDocumentIds,
      type
    });
    const chunks = retrieved.chunks;
    await recordStep('retriever', 'completed', { chunkCount: chunks.length });

    const documents = selectedDocumentIds.length
      ? await repository.getAll('documents', {
        userId,
        workspaceId,
        id: { $in: selectedDocumentIds }
      })
      : [];
    const taskOutput = await taskAgent({ type, input, chunks, documents });
    await recordStep('task', 'completed', { outputFields: Object.keys(taskOutput) });

    const output = writerAgent({ type, taskOutput });
    const citations = chunks.map(workflowService.chunkToCitation);
    await recordStep('writer', 'completed', { citationCount: citations.length });

    const evaluation = evaluatorAgent({ type, citations, output, chunks });
    await recordStep('evaluator', 'completed', evaluation);

    return await repository.updateById('workflowRuns', run.id, {
      status: 'completed',
      output,
      citations,
      evaluation,
      trace
    });
  } catch (error) {
    trace.push(makeTraceEntry('error', 'failed', { message: error.message }));
    await repository.updateById('workflowRuns', run.id, {
      status: 'failed',
      evaluation: { note: 'The workflow failed before producing a reliable result.', confidence: 0 },
      trace
    });
    throw error;
  }
}

module.exports = {
  runWorkflow,
  makeTraceEntry
};
