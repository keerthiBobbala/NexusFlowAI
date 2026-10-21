import React from 'react';

const Field = React.forwardRef(function Field({ label, error, className = '', children, ...props }, ref) {
  return (
    <label className={`block ${className}`}>
      {label ? <div className="mb-1 text-sm font-medium text-slate-700">{label}</div> : null}
      {children || <input ref={ref} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100" {...props} />}
      {error ? <div className="mt-1 text-xs text-rose-700">{error}</div> : null}
    </label>
  );
});

export default Field;
