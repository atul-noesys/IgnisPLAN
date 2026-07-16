import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const proto = path.resolve(dir, "../../../../prototype/assets");

function readProto(name) {
  return fs.readFileSync(path.join(proto, name), "utf8");
}

function rewriteGlobals(source, names) {
  let s = source;
  for (const n of names) {
    const re = new RegExp(`(?<!globalThis\\.)(?<!\\.)\\b${n}\\b`, "g");
    s = s.replace(re, (match, offset) => {
      const before = s.slice(Math.max(0, offset - 40), offset);
      if (/(const|var|let)\s+$/.test(before)) return match;
      if (/globalThis\.$/.test(before)) return match;
      if (/[{,]\s*$/.test(before)) return match;
      if (/\/\/[^\n]*$/.test(before)) return match;
      if (/export\s*\{\s*$/.test(before)) return match;
      if (/export\s*\{\s*[^}]*$/.test(before) && !before.includes("}")) return match;
      return `globalThis.${n}`;
    });
  }
  return s;
}

const NAMES = [
  "Store",
  "SchedulerSlots",
  "ScheduleTimeline",
  "BedTimeline",
  "BedSlots",
  "UI",
  "MOCK_DATA",
];

// mock-data.js
{
  let s = readProto("mock-data.js");
  s = s.replace(/window\.MOCK_DATA/g, "globalThis.MOCK_DATA");
  s += "\nexport const MOCK_DATA = globalThis.MOCK_DATA;\n";
  fs.writeFileSync(path.join(dir, "mock-data.js"), s);
  console.log("wrote mock-data.js");
}

// ui.js
{
  let s = readProto("ui.js");
  s = s.replace(/window\.UI\s*=\s*UI\s*;/, "globalThis.UI = UI;\nexport { UI };");
  s = rewriteGlobals(s, NAMES.filter((n) => n !== "UI"));
  s = s.replace(/globalThis\.UI\s*=\s*globalThis\.UI/, "globalThis.UI = UI");
  s = s.replace(/export\s*\{\s*globalThis\.UI\s*\}/, "export { UI }");
  fs.writeFileSync(path.join(dir, "ui.js"), s);
  console.log("wrote ui.js");
}

// store.js
{
  let s = readProto("store.js");
  s = s.replace(/window\.MOCK_DATA/g, "globalThis.MOCK_DATA");
  s = s.replace(/window\.SchedulerSlots/g, "globalThis.SchedulerSlots");
  s = s.replace(/window\.BedSlots/g, "globalThis.BedSlots");
  s = s.replace(/window\.Store\s*=\s*Store\s*;/, "globalThis.Store = Store;\nexport { Store };");
  s = rewriteGlobals(s, NAMES.filter((n) => n !== "Store" && n !== "MOCK_DATA"));
  // Keep Store identifier for const Store and assignment
  s = rewriteGlobals(s, ["SchedulerSlots", "ScheduleTimeline", "BedSlots", "BedTimeline", "UI"]);
  s = s.replace(/globalThis\.Store\s*=\s*globalThis\.Store/, "globalThis.Store = Store");
  s = s.replace(/export\s*\{\s*globalThis\.Store\s*\}/, "export { Store }");
  s = `import "./mock-data.js";\n` + s;
  fs.writeFileSync(path.join(dir, "store.js"), s);
  console.log("wrote store.js");
}

// slots.js
{
  let s = readProto("slots.js");
  s = s.replace(/window\.SchedulerSlots\s*=/, "globalThis.SchedulerSlots =");
  s = rewriteGlobals(s, ["Store", "ScheduleTimeline"]);
  s += "\nexport const SchedulerSlots = globalThis.SchedulerSlots;\n";
  fs.writeFileSync(path.join(dir, "slots.js"), s);
  console.log("wrote slots.js");
}

// bed-slots.js
{
  let s = readProto("bed-slots.js");
  s = s.replace(/window\.BedSlots\s*=/, "globalThis.BedSlots =");
  s = s.replace(/window\.UI/g, "globalThis.UI");
  s = s.replace(/window\.SchedulerSlots/g, "globalThis.SchedulerSlots");
  s = rewriteGlobals(s, ["UI", "SchedulerSlots"]);
  s =
    `import "./slots.js";\nimport "./ui.js";\n` +
    s +
    "\nexport const BedSlots = globalThis.BedSlots;\n";
  fs.writeFileSync(path.join(dir, "bed-slots.js"), s);
  console.log("wrote bed-slots.js");
}

// schedule-timeline.js
{
  let s = readProto("schedule-timeline.js");
  s = s.replace(/window\.UI/g, "globalThis.UI");
  s = s.replace(
    /window\.ScheduleTimeline\s*=\s*ScheduleTimeline\s*;/,
    "globalThis.ScheduleTimeline = ScheduleTimeline;\nexport { ScheduleTimeline };",
  );
  s = rewriteGlobals(s, ["Store", "SchedulerSlots", "UI"]);
  s = s.replace(
    /globalThis\.ScheduleTimeline\s*=\s*globalThis\.ScheduleTimeline/,
    "globalThis.ScheduleTimeline = ScheduleTimeline",
  );
  s = s.replace(/export\s*\{\s*globalThis\.ScheduleTimeline\s*\}/, "export { ScheduleTimeline }");
  fs.writeFileSync(path.join(dir, "schedule-timeline.js"), s);
  console.log("wrote schedule-timeline.js");
}

// bed-timeline.js
{
  let s = readProto("bed-timeline.js");
  s = s.replace(/window\.UI/g, "globalThis.UI");
  s = s.replace(
    /window\.BedTimeline\s*=\s*BedTimeline\s*;/,
    "globalThis.BedTimeline = BedTimeline;\nexport { BedTimeline };",
  );
  s = rewriteGlobals(s, ["Store", "BedSlots", "SchedulerSlots", "UI"]);
  s = s.replace(
    /globalThis\.BedTimeline\s*=\s*globalThis\.BedTimeline/,
    "globalThis.BedTimeline = BedTimeline",
  );
  s = s.replace(/export\s*\{\s*globalThis\.BedTimeline\s*\}/, "export { BedTimeline }");
  fs.writeFileSync(path.join(dir, "bed-timeline.js"), s);
  console.log("wrote bed-timeline.js");
}

console.log("all done");
