export default function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-md shadow-indigo-950/15 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-teal-700 hover:shadow-lg',
    secondary: 'bg-slate-100 text-slate-800 shadow-sm hover:-translate-y-0.5 hover:bg-slate-200',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    danger: 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-sm hover:-translate-y-0.5 hover:from-rose-700 hover:to-orange-700'
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
