export function formatKobo(kobo: number): string {
  const naira = Math.round(kobo / 100);
  return `₦${naira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function shortOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
