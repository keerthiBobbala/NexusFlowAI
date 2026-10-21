export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function formatStatusLabel(status) {
  return String(status || '').replace(/_/g, ' ');
}
