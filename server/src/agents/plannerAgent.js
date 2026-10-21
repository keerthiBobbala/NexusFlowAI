function plannerAgent({ type, input = {}, selectedDocumentIds = [] }) {
  const query = input.question || input.prompt || input.topic || type.replace(/_/g, ' ');
  const instructions = {
    ask: 'Answer the question using only the provided document context.',
    summarize: 'Summarize the provided document context and identify key points.',
    compare: 'Compare the selected documents using their provided context.',
    meeting_action_items: 'Identify actionable tasks and responsibilities in the context.',
    research_brief: 'Create a concise research brief grounded in the provided context.'
  }[type] || '';
  return { type, query, selectedDocumentIds, instructions };
}

module.exports = plannerAgent;
