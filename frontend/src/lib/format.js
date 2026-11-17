export function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || Number.isNaN(Number(bytes))) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = Number(bytes), i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}
export function timeAgo(date, locale = "en") {
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return "";
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  let s = Math.round((then - Date.now()) / 1000);
  for (const [unit, size] of [["second", 60], ["minute", 60], ["hour", 24], ["day", 7], ["week", 4.345], ["month", 12], ["year", Infinity]]) {
    if (Math.abs(s) < size) return rtf.format(Math.round(s), unit);
    s /= size;
  }
  return "";
}
export function initials(name = "") {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}
export function hashString(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
