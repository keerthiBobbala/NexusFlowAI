export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {description ? <div className="mt-2 text-sm text-slate-600">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
