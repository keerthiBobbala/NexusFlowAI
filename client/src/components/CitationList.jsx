export default function CitationList({ citations = [] }) {
  if (!citations.length) {
    return <div className="text-sm text-slate-500">No citations available.</div>;
  }
  return (
    <div className="space-y-3">
      {citations.map((citation, index) => (
        <div key={`${citation.documentId || index}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="font-medium text-slate-900">{citation.documentName || 'Document'}</div>
            <div className="text-slate-500">{Number(citation.score || 0).toFixed(3)}</div>
          </div>
          <div className="mt-2 text-sm text-slate-600">{citation.snippet}</div>
        </div>
      ))}
    </div>
  );
}
