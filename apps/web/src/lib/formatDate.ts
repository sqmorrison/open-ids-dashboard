// lib/formatDate.ts

export function formatToLocal(timestamp: string | number): string {
  if (!timestamp) return "-";

  // 1. Force the input to be treated as UTC
  // ClickHouse often returns "2026-01-14 15:00:00" without the "Z" or "+00".
  // If we don't add "Z", the browser assumes it's ALREADY local time.
  let dateObj: Date;
  
  if (typeof timestamp === 'string') {
    // If it's already an ISO string with Z, great. If not, append Z.
    const safeTimestamp = timestamp.endsWith("Z") || timestamp.includes("+") 
      ? timestamp 
      : `${timestamp}Z`; 
    dateObj = new Date(safeTimestamp);
  } else {
    // If it's a Unix number (ms)
    dateObj = new Date(timestamp);
  }

  // 2. Format specifically for Central Time (Demo Safe)
  // This ensures it says "CST/CDT" even if you present from a laptop set to UTC.
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', // Force Central Time
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(dateObj);
}