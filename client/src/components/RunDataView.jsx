function Section({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
      {children}
    </div>
  );
}

function EmptyHint({ children }) {
  return <div className="text-sm text-slate-500">{children}</div>;
}

function ValueBlock({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm leading-6 text-slate-800 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function ListBlock({ label, items = [] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      {items.length ? (
        <ul className="mt-2 space-y-2 text-sm text-slate-800">
          {items.map((item, index) => (
            <li key={`${label}-${index}`} className="rounded-md bg-white px-3 py-2 shadow-sm">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-1 text-sm text-slate-500">None</div>
      )}
    </div>
  );
}

function ItemCard({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="font-medium text-slate-900">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-700">{children}</div>
    </div>
  );
}

function formatRunInput(run, documentNameMap) {
  const input = run?.input || {};
  const documentIds = Array.isArray(input.documentIds) ? input.documentIds : [];
  return {
    prompt: input.question || input.prompt || input.topic || 'No prompt provided.',
    documents: documentIds.map((id) => documentNameMap.get(id) || id),
    threadId: input.threadId || ''
  };
}

function renderOutput(run) {
  const output = run?.output || {};

  if (run?.type === 'ask') {
    return (
      <Section title="Answer">
        <ValueBlock label="Response" value={output.answer || 'No answer available.'} />
      </Section>
    );
  }

  if (run?.type === 'summarize') {
    return (
      <Section title="Summary">
        <div className="space-y-3">
          <ValueBlock label="Summary" value={output.summary || 'No summary available.'} />
          <ListBlock label="Key Points" items={output.keyPoints || []} />
        </div>
      </Section>
    );
  }

  if (run?.type === 'compare') {
    return (
      <Section title="Comparison">
        <div className="space-y-4">
          <ValueBlock label="Overview" value={output.overview || 'No overview available.'} />
          <ListBlock label="Similarities" items={output.similarities || []} />
          <ListBlock label="Differences" items={output.differences || []} />
          <div className="grid gap-3">
            {(output.documentTakeaways || []).map((item, index) => (
              <ItemCard key={`${item.documentId || index}-${index}`} title={item.documentName || `Document ${index + 1}`}>
                {item.takeaway || 'No takeaway available.'}
              </ItemCard>
            ))}
          </div>
        </div>
      </Section>
    );
  }

  if (run?.type === 'meeting_action_items') {
    return (
      <Section title="Action Items">
        <div className="space-y-4">
          <ValueBlock label="Summary" value={output.summary || 'No summary available.'} />
          <div className="grid gap-3">
            {(output.actionItems || []).map((item, index) => (
              <div key={`${item.task || index}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="font-medium text-slate-900">{item.task || 'Untitled task'}</div>
                <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
                  <div><span className="font-semibold text-slate-900">Owner:</span> {item.owner || 'Unassigned'}</div>
                  <div><span className="font-semibold text-slate-900">Priority:</span> {item.priority || 'medium'}</div>
                  <div><span className="font-semibold text-slate-900">Due:</span> {item.dueNote || 'No due note'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    );
  }

  if (run?.type === 'research_brief') {
    return (
      <Section title="Research Brief">
        <div className="space-y-4">
          <ValueBlock label="Title" value={output.title || 'Research Brief'} />
          <ValueBlock label="Executive Summary" value={output.executiveSummary || 'No executive summary available.'} />
          <div className="grid gap-3">
            {(output.themes || []).map((theme, index) => (
              <ItemCard key={`${theme.heading || index}-${index}`} title={theme.heading || `Theme ${index + 1}`}>
                {Array.isArray(theme.details) && theme.details.length ? theme.details.join(' ') : 'No details available.'}
              </ItemCard>
            ))}
          </div>
          <ValueBlock label="Conclusion" value={output.conclusion || 'No conclusion available.'} />
        </div>
      </Section>
    );
  }

  if (Object.keys(output).length) {
    return (
      <Section title="Output">
        <pre className="whitespace-pre-wrap text-sm text-slate-700">{JSON.stringify(output, null, 2)}</pre>
      </Section>
    );
  }

  return (
    <Section title="Output">
      <EmptyHint>No output available.</EmptyHint>
    </Section>
  );
}

function renderEvaluation(run) {
  const evaluation = run?.evaluation || {};
  return (
    <Section title="Evaluation">
      <div className="space-y-3">
        <ValueBlock label="Note" value={evaluation.note || 'No evaluation note available.'} />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-teal-600"
                style={{ width: `${Math.max(0, Math.min(1, Number(evaluation.confidence || 0))) * 100}%` }}
              />
            </div>
            <div className="w-12 text-right text-sm font-medium text-slate-700">
              {Number(evaluation.confidence || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function renderInput(run, documentNameMap) {
  const input = formatRunInput(run, documentNameMap);
  return (
    <Section title="Input">
      <div className="space-y-3">
        <ValueBlock label="Prompt" value={input.prompt} />
        {input.documents.length ? <ListBlock label="Selected Documents" items={input.documents} /> : null}
        {input.threadId ? <ValueBlock label="Thread" value={input.threadId} /> : null}
      </div>
    </Section>
  );
}

export {
  Section,
  EmptyHint,
  ValueBlock,
  ListBlock,
  ItemCard,
  renderOutput,
  renderInput,
  renderEvaluation
};
