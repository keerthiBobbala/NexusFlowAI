const workflowService = require('../services/workflowService');

async function taskAgent({ type, input = {}, chunks = [], documents = [] }) {
  const builders = {
    ask: () => workflowService.buildAskOutput({ question: input.question || '', chunks }),
    summarize: () => workflowService.buildSummaryOutput({ prompt: input.prompt || '', chunks }),
    compare: () => workflowService.buildCompareOutput({ prompt: input.prompt || '', chunks, documents }),
    meeting_action_items: () => workflowService.buildActionItemsOutput({ chunks }),
    research_brief: () => workflowService.buildResearchBriefOutput({ prompt: input.prompt || input.topic || '', chunks })
  };
  const build = builders[type];
  if (!build) throw new Error(`Unsupported workflow type: ${type}`);
  return build();
}

module.exports = taskAgent;
