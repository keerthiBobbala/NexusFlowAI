export default function LoadingState({ label = 'Loading…' }) {
  return <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{label}</div>;
}
