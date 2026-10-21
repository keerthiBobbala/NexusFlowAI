function writerAgent({ type, taskOutput = {} }) {
  const fields = {
    ask: ['answer'],
    summarize: ['summary', 'keyPoints'],
    compare: ['overview', 'similarities', 'differences', 'documentTakeaways'],
    meeting_action_items: ['summary', 'actionItems'],
    research_brief: ['title', 'executiveSummary', 'themes', 'conclusion']
  }[type];
  if (!fields) throw new Error(`Unsupported workflow type: ${type}`);
  return Object.fromEntries(fields.map((field) => [field, taskOutput[field]]));
}

module.exports = writerAgent;
