const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatSinceDate(date) {
  if (!date) return " (full scan)";
  const d = new Date(date);
  return `, since ${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}
