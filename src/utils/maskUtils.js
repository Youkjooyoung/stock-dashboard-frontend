export function maskPhone(p) {
  if (!p) return '';
  const d = String(p).replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-***-${d.slice(6)}`;
  return p;
}

export function maskEmail(e) {
  if (!e) return '';
  const at = e.indexOf('@');
  if (at < 0) return e;
  const local = e.slice(0, at);
  const domain = e.slice(at);
  if (local.length <= 2) return `${local[0] || ''}***${domain}`;
  return `${local.slice(0, 2)}***${domain}`;
}
