function describeDetail(detail) {
  if (detail == null) {
    return 'No detail provided.';
  }
  if (typeof detail === 'string') {
    return detail;
  }
  if (typeof detail === 'number' || typeof detail === 'boolean') {
    return String(detail);
  }
  if (Array.isArray(detail)) {
    return detail.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(', ');
  }
  const entries = Object.entries(detail);
  if (!entries.length) {
    return 'No detail provided.';
  }
  return entries
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n');
}

export default function RunTrace({ trace = [] }) {
  if (!trace.length) {
    return <div className="text-sm text-slate-500">No execution trace available.</div>;
  }
  return (
    <div className="space-y-2">
      {trace.map((entry, index) => (
        <div key={`${entry.step}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">{entry.step}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{entry.status}</div>
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">{describeDetail(entry.detail)}</pre>
        </div>
      ))}
    </div>
  );
}
