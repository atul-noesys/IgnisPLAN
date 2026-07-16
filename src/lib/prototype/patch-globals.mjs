import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = [
  "store.js",
  "slots.js",
  "bed-slots.js",
  "schedule-timeline.js",
  "bed-timeline.js",
  "ui.js",
];
const names = [
  "Store",
  "SchedulerSlots",
  "ScheduleTimeline",
  "BedTimeline",
  "BedSlots",
  "UI",
  "MOCK_DATA",
];

for (const file of files) {
  const filePath = path.join(dir, file);
  let s = fs.readFileSync(filePath, "utf8");

  for (const n of names) {
    const re = new RegExp(`(?<!globalThis\\.)(?<!\\.)\\b${n}\\b`, "g");
    s = s.replace(re, (match, offset) => {
      const before = s.slice(Math.max(0, offset - 30), offset);
      if (/(const|var|let)\s+$/.test(before)) return match;
      if (/globalThis\.$/.test(before)) return match;
      // Avoid object property shorthand keys after { or ,
      if (/[{,]\s*$/.test(before)) return match;
      // Skip line comments
      if (/\/\/[^\n]*$/.test(before)) return match;
      return `globalThis.${n}`;
    });
  }

  fs.writeFileSync(filePath, s);
  console.log("patched", file);
}
