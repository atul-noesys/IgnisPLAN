function ordinalDay(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/** e.g. 2026-07-16 → "16th July" */
export function formatDayMonthNoYear(dateStr: string): string {
  const text = String(dateStr || "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(`${text}T12:00:00`);
  if (Number.isNaN(date.getTime())) return text;

  const month = date.toLocaleDateString("en-GB", { month: "long" });
  return `${ordinalDay(date.getDate())} ${month}`;
}
