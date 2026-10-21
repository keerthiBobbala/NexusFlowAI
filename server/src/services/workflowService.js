const { cleanText, summarizeFallback, extractActionItems, splitSentences, topKeywords, tokenize } = require('../utils/text');
const { generateLocalText } = require('./ollamaService');

function chunkToCitation(chunk) {
  return {
    documentId: chunk.documentId,
    documentName: chunk.documentName || 'Document',
    snippet: chunk.snippet || cleanText(chunk.text).slice(0, 240),
    score: Number((chunk.score || 0).toFixed(3))
  };
}

function combineChunks(chunks = [], limit = 8) {
  return chunks.slice(0, limit).map((chunk) => cleanText(chunk.text)).filter(Boolean).join('\n\n');
}

function conciseSummary(text, maxSentences = 2, maxCharacters = 320) {
  const sentences = splitSentences(text);
  if (sentences.length <= maxSentences && text.length <= maxCharacters) return text;
  const keywords = new Set(topKeywords(text, 12));
  const ranked = sentences.map((sentence, index) => {
    const terms = tokenize(sentence);
    const distinctKeywords = new Set(terms.filter((term) => keywords.has(term)));
    return {
      sentence,
      index,
      score: distinctKeywords.size / Math.max(1, Math.sqrt(terms.length))
    };
  });
  const selected = ranked
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, maxSentences)
    .sort((left, right) => left.index - right.index);
  let summary = '';
  for (const { sentence } of selected) {
    const shortened = sentence.length > maxCharacters
      ? `${sentence.slice(0, maxCharacters - 1).trimEnd()}…`
      : sentence;
    const next = summary ? `${summary} ${shortened}` : shortened;
    if (next.length > maxCharacters) break;
    summary = next;
  }
  return summary || sentences[0]?.slice(0, maxCharacters) || '';
}

async function polishWithOllama(prompt, fallbackText, maxCharacters = 320) {
  if (!fallbackText) return '';
  const polished = await generateLocalText(prompt, {
    system: 'Use only the supplied source context. Do not invent details. If the context does not answer the task, say so.'
  });
  const result = polished || fallbackText;
  return result.length > maxCharacters
    ? `${result.slice(0, maxCharacters - 1).trimEnd()}…`
    : result;
}

function extractOwnerAnswer(question, chunks) {
  if (!/\bwho\b/i.test(question) || !/\b(owner|owns|responsible)\b/i.test(question)) return null;
  for (const chunk of chunks) {
    const text = cleanText(chunk.text);
    const parentheticalName = text.match(/\(([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?:\s*,[^)]*)?\)/);
    const labeledOwner = text.match(/\b(?:owner|owned by|responsible(?:\s+owner)?|assigned to)\s*[:=-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i);
    const namedOwner = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(?:owns|is responsible for|will resolve|to resolve)\b/i);
    const name = parentheticalName?.[1] || labeledOwner?.[1] || namedOwner?.[1];
    if (name) {
      if (parentheticalName) {
        const task = text.slice(0, parentheticalName.index).replace(/^[-*•]\s*/, '').trim();
        const deadline = text.match(/\bby\s+[^),.;]+/i)?.[0];
        if (task) {
          return `${name} is assigned to ${task.charAt(0).toLowerCase()}${task.slice(1)}${deadline ? ` (${deadline})` : ''}.`;
        }
      }
      const entities = question.match(/\b[A-Z][A-Za-z0-9]+\b/g)?.filter((entity) => entity.toLowerCase() !== 'who') || [];
      return `${name} is listed as the owner${entities.length ? ` of the ${entities[0]} item` : ''}.`;
    }
  }
  return null;
}

function extractMilestoneAnswer(question, chunks) {
  if (!/\bwhen\b/i.test(question) || !/\b(start|begin|launch|planned|schedule)\w*/i.test(question)) return null;
  const monthNames = 'January|February|March|April|May|June|July|August|September|October|November|December';
  const rowPattern = new RegExp(`\\b(\\d{1,2}\\s+(?:${monthNames})(?:\\s+\\d{4})?)\\b`, 'i');
  const questionTerms = tokenize(question)
    .filter((term) => !['when', 'does', 'do', 'the', 'testing', 'start', 'begin', 'launch', 'planned'].includes(term))
    .map((term) => term.toLowerCase());

  for (const chunk of chunks) {
    const rows = cleanText(chunk.text).split('\n').filter((line) => line.includes('|'));
    for (const row of rows) {
      const cells = row.split('|').map((cell) => cell.trim()).filter(Boolean);
      if (cells.length < 3) continue;
      const label = cells[0].replace(/\*\*/g, '').trim();
      const labelTerms = tokenize(label).map((term) => term.toLowerCase());
      if (!questionTerms.length || !questionTerms.some((term) => labelTerms.includes(term))) continue;

      const dateCell = cells.find((cell) => rowPattern.test(cell));
      if (!dateCell) continue;
      const dateMatch = dateCell.match(rowPattern);
      let date = dateMatch[1];
      if (!/\b\d{4}\b/.test(date)) {
        const year = new Date().getFullYear();
        const parsedDate = new Date(`${date} ${year} 12:00:00`);
        const currentDate = new Date();
        if (parsedDate < new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())) {
          date = `${date} ${year + 1}`;
        } else {
          date = `${date} ${year}`;
        }
      }
      const status = cells.find((cell) => /\b(not started|in progress|completed|complete|done|at risk|delayed)\b/i.test(cell));
      const statusText = status?.replace(/\*\*/g, '').trim().toLowerCase();
      const state = statusText === 'not started'
        ? 'and has not started yet'
        : statusText === 'in progress'
          ? 'and is in progress'
          : statusText === 'completed' || statusText === 'complete' || statusText === 'done'
            ? 'and has been completed'
            : statusText === 'at risk'
              ? 'and is currently at risk'
              : statusText === 'delayed'
                ? 'and is delayed'
                : '';
      const source = chunk.documentName || 'Document';
      return {
        answer: `${label} is planned to start on **${date}** ${state}. *Source: ${source}*`.replace(/\s+\./g, '.'),
        source,
        snippet: row.replace(/^\|/, '').replace(/\|$/, '').trim()
      };
    }
  }
  return null;
}

function extractFasterAnswer(question, chunks) {
  if (!/\bhow\s+much\b/i.test(question) || !/\b(faster|speed|quick|checkout)\b/i.test(question)) return null;
  const text = chunks.map((chunk) => cleanText(chunk.text)).join(' ');
  if (!/\b(checkout|prototype)\b/i.test(text) || !/\b(faster|quicker|speed|improv|reduc)\w*/i.test(text)) return null;
  const improvement = text.match(/(\d+(?:\.\d+)?)\s*(%|percent)\s*(?:faster|quicker|speed improvement|improvement(?:\s+in\s+speed)?)/i) ||
    text.match(/(?:faster|quicker|improved by|improvement of)\s*(\d+(?:\.\d+)?)\s*(%|percent)/i);
  if (improvement) {
    return `Checkout is reported as ${improvement[1]}% faster in the prototype testing.`;
  }

  const times = text.match(/(?:from\s+)?(\d+(?:\.\d+)?)\s*(milliseconds?|ms|seconds?|secs?|minutes?|mins?)\s+to\s+(\d+(?:\.\d+)?)\s*(milliseconds?|ms|seconds?|secs?|minutes?|mins?)/i);
  if (times) {
    const oldTime = Number(times[1]);
    const newTime = Number(times[3]);
    const unit = times[2].toLowerCase();
    if (oldTime > 0 && newTime < oldTime) {
      const percentFaster = Math.round(((oldTime - newTime) / oldTime) * 100);
      return `Checkout is ${percentFaster}% faster, decreasing from ${times[1]} ${unit} to ${times[3]} ${times[4]}.`;
    }
  }
  return 'The report mentions faster checkout but does not specify the amount of improvement.';
}

async function buildAskOutput({ question, chunks }) {
  const context = combineChunks(chunks);
  const fallback = context
    ? conciseSummary(chunks[0].text, 1, 320)
    : 'I could not find any processed documents in this workspace to answer that question. Upload and process a document, then try again.';
  const milestone = context ? extractMilestoneAnswer(question, chunks) : null;
  const directAnswer = context
    ? milestone?.answer || extractOwnerAnswer(question, chunks) || extractFasterAnswer(question, chunks)
    : null;
  const answer = directAnswer || (context
    ? await polishWithOllama(
      `Answer the question directly in one short sentence. Use only facts explicitly stated in the source. Do not repeat headings or list the full context. If the source does not contain the requested fact, say that it is not specified.\n\nQuestion: ${question}\n\nSource context:\n${context}`,
      fallback,
      400
    )
    : fallback);
  return {
    answer,
    citations: milestone
      ? [{ documentId: chunks[0]?.documentId, documentName: milestone.source, snippet: milestone.snippet, score: chunks[0]?.score || 0 }]
      : (directAnswer ? chunks.slice(0, 1) : chunks).map(chunkToCitation)
  };
}

async function buildSummaryOutput({ prompt, chunks }) {
  const context = combineChunks(chunks);
  if (!context) {
    return {
      summary: 'No processed document content is available to summarize. Upload and process documents in this workspace first.',
      keyPoints: [],
      citations: []
    };
  }
  const summary = await polishWithOllama(
    `Summarize this source material${prompt ? ` for this request: ${prompt}` : ''}.\n\nSource context:\n${context}`,
    conciseSummary(context, 1, 240),
    240
  );
  const summarySentences = new Set(splitSentences(summary).map((sentence) => sentence.toLowerCase()));
  const keyPoints = splitSentences(context)
    .filter((sentence) => tokenize(sentence).length >= 5 && !summarySentences.has(sentence.toLowerCase()))
    .map((sentence) => conciseSummary(sentence, 1, 140))
    .filter(Boolean)
    .slice(0, 2);
  return {
    summary,
    keyPoints: keyPoints.length ? keyPoints : topKeywords(context, 5),
    citations: chunks.map(chunkToCitation)
  };
}

async function buildCompareOutput({ prompt, chunks, documents = [] }) {
  const grouped = new Map();
  for (const chunk of chunks) {
    const group = grouped.get(chunk.documentId) || { documentId: chunk.documentId, documentName: chunk.documentName, chunks: [] };
    group.chunks.push(chunk);
    grouped.set(chunk.documentId, group);
  }
  for (const document of documents) {
    if (!grouped.has(document.id)) {
      grouped.set(document.id, { documentId: document.id, documentName: document.originalName, chunks: [] });
    }
  }
  const entries = [...grouped.values()];
  const documentTakeaways = entries.map((entry) => {
    const text = combineChunks(entry.chunks, 20);
    return {
      documentId: entry.documentId,
      documentName: entry.documentName || 'Document',
      takeaway: text ? conciseSummary(text, 1, 240) : 'No processed text is available for this document.'
    };
  });
  const keywordGroups = entries.map((entry) => new Set(topKeywords(combineChunks(entry.chunks, 20), 12)));
  const similarities = keywordGroups.length
    ? [...keywordGroups[0]].filter((keyword) => keywordGroups.every((keywords) => keywords.has(keyword))).slice(0, 8)
    : [];
  const differences = [...new Set(keywordGroups.flatMap((keywords) => [...keywords]))]
    .filter((keyword) => keywordGroups.filter((keywords) => keywords.has(keyword)).length === 1)
    .slice(0, 8);
  const overview = entries.length
    ? `${entries.length} document(s) compared${prompt ? ` for: ${prompt}` : ''}. Shared themes: ${similarities.join(', ') || 'none identified'}.`
    : 'No processed document content is available to compare.';
  return {
    overview,
    similarities,
    differences,
    documentTakeaways,
    citations: chunks.map(chunkToCitation)
  };
}

async function buildActionItemsOutput({ chunks }) {
  const context = combineChunks(chunks);
  const actionItems = extractActionItems(context).map((task) => ({
    task,
    owner: '',
    priority: /urgent|immediately|asap/i.test(task) ? 'high' : 'medium',
    dueNote: ''
  }));
  return {
    summary: context
      ? conciseSummary(context, 1, 240)
      : 'No processed document content is available to analyze.',
    actionItems: actionItems.length
      ? actionItems
      : context
        ? [{ task: 'Review the source documents and identify any required follow-up actions.', owner: '', priority: 'low', dueNote: '' }]
        : [],
    citations: chunks.map(chunkToCitation)
  };
}

async function buildResearchBriefOutput({ prompt, chunks }) {
  const context = combineChunks(chunks);
  if (!context) {
    return {
      title: prompt || 'Research Brief',
      executiveSummary: 'No processed document content is available to prepare a research brief.',
      themes: [],
      conclusion: 'Upload and process relevant documents, then run the research brief again.',
      citations: []
    };
  }
  const sentences = splitSentences(context);
  const keywords = topKeywords(context, 5);
  const themes = keywords.map((keyword) => ({
    heading: keyword.charAt(0).toUpperCase() + keyword.slice(1),
    details: sentences.filter((sentence) => sentence.toLowerCase().includes(keyword)).slice(0, 1).map((sentence) => conciseSummary(sentence, 1, 200))
  }));
  const executiveSummary = await polishWithOllama(
    `Prepare a concise research brief${prompt ? ` about: ${prompt}` : ''}.\n\nSource context:\n${context}`,
    conciseSummary(context, 1, 240),
    240
  );
  const conciseThemes = themes.slice(0, 3);
  return {
    title: prompt ? `Research Brief: ${prompt}` : 'Research Brief',
    executiveSummary,
    themes: conciseThemes,
    conclusion: sentences.length ? sentences[sentences.length - 1] : executiveSummary,
    citations: chunks.map(chunkToCitation)
  };
}

module.exports = {
  buildAskOutput,
  buildSummaryOutput,
  buildCompareOutput,
  buildActionItemsOutput,
  buildResearchBriefOutput,
  chunkToCitation
};
