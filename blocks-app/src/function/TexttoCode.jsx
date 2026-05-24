function extract(src, name) {
  const re = new RegExp(
    String.raw`(^|\n)[ \t]*#${name}[ \t]*([\s\S]*?)#END`,
    "g"
  );

  let bodyList = [];
  let m;

  while ((m = re.exec(src)) !== null) {
    const content = m[2].replace(/\r/g, "").trim();
    if (content) bodyList.push(content);
  }

  return {
    body: bodyList.join("\n"),
    src: src.replace(re, "").replace(/\n{3,}/g, "\n\n")
  };
}

function ensureFunc(src, name) {
  if (new RegExp(`\\bvoid\\s+${name}\\s*\\(`).test(src)) return src;
  return src.trimEnd() + `\n\nvoid ${name}() {\n}\n`;
}

function getFunc(src, name) {
  const re = new RegExp(
    String.raw`(void\s+${name}\s*\(\s*\)\s*\{)([\s\S]*?)(\n\})`,
    "m"
  );
  const m = src.match(re);
  if (!m) return null;
  return { full: m[0], head: m[1], body: m[2], tail: m[3], index: m.index };
}

function replaceFuncBody(src, name, newBody) {
  const f = getFunc(src, name);
  if (!f) return src;
  const rebuilt = `${f.head}\n${newBody}\n${f.tail}`;
  return src.slice(0, f.index) + rebuilt + src.slice(f.index + f.full.length);
}

function stripEmptyLines(s) {
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeLineForCompare(line) {
  return line.replace(/\s+/g, " ").trim();
}

function dedupeByLine(src) {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const seen = new Set();
  const out = [];

  for (const line of lines) {
    const key = normalizeLineForCompare(line);
    if (!key) {
      out.push("");
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line.trim());
  }

  return stripEmptyLines(out.join("\n"));
}

function dedupeIncludes(src) {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const seen = new Set();
  const out = [];

  for (const line of lines) {
    const t = line.trim();
    if (/^#include\b/.test(t)) {
      const key = normalizeLineForCompare(t);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
      continue;
    }
    out.push(line);
  }

  return stripEmptyLines(out.join("\n"));
}

// formatter แบบง่ายจากปีกกา
function formatByBraces(code, indent = "  ") {
  let level = 0;
  return code
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (t.startsWith("}")) level--;
      const out = indent.repeat(Math.max(level, 0)) + t;
      if (t.endsWith("{")) level++;
      return out;
    })
    .join("\n");
}

export default function TexttoCode(input) {
  let s = input.replace(/\r\n/g, "\n");

  // 1) ดึง block ที่มีอยู่ (ไม่มี = body เป็น "")
  const blocks = {};
  for (const k of ["EXTINC", "VARIABLE", "FUNCTION", "SETUP", "LOOP_EXT_CODE"]) {
    const r = extract(s, k);
    s = r.src;
    blocks[k] = r.body;
  }

  // Clean duplicated lines from generated blocks before merging into final code.
  blocks.EXTINC = dedupeIncludes(blocks.EXTINC);
  blocks.VARIABLE = dedupeByLine(blocks.VARIABLE);
  blocks.SETUP = dedupeByLine(blocks.SETUP);

  // 2) ensure มี setup/loop (แต่ถ้า user มีอยู่แล้ว ไม่แตะ header)
  s = ensureFunc(s, "setup");
  s = ensureFunc(s, "loop");

  // 3) เอาโค้ดเดิมใน setup/loop ออกมา “คงไว้” แล้วค่อยแทรก section (ถ้ามี)
  const setupPart = getFunc(s, "setup");
  const loopPart = getFunc(s, "loop");

  const existingSetup = (setupPart?.body ?? "").trim();
  const existingLoop = (loopPart?.body ?? "").trim();

  const newSetupBody = stripEmptyLines(
    [blocks.SETUP, existingSetup].filter(Boolean).join("\n\n")
  );

  const newLoopBody = stripEmptyLines(
    [blocks.LOOP_EXT_CODE, existingLoop].filter(Boolean).join("\n\n")
  );

  s = replaceFuncBody(s, "setup", dedupeByLine(newSetupBody));
  s = replaceFuncBody(s, "loop", newLoopBody);

  // 4) แทรกส่วนบนไฟล์ "เฉพาะที่มีจริง" โดย "ไม่ลบของเดิม"
  //    - EXTINC: พยายามแทรกหลัง include เดิม (ถ้ามี) เพื่อให้ต่อเนื่อง
  //    - VARIABLE/FUNCTION: แทรกก่อน setup() แต่คง prefix เดิมไว้
  const idxSetup = s.search(/^\s*void\s+setup\s*\(/m);

  if (idxSetup >= 0) {
    const prefix = s.slice(0, idxSetup);
    const rest = s.slice(idxSetup);

    let newPrefix = prefix;

    // 4.1) EXTINC -> แทรกหลัง include กลุ่มท้ายสุด ถ้ามี
    if (blocks.EXTINC) {
      const includeRe = /^[ \t]*#include[^\n]*$/gm;
      let lastIncludeEnd = -1;
      while (includeRe.exec(prefix) !== null) {
        lastIncludeEnd = includeRe.lastIndex; // ตำแหน่งหลังบรรทัด include ล่าสุด
      }

      if (lastIncludeEnd >= 0) {
        // มี include เดิม -> แทรกต่อท้าย include เดิม
        newPrefix =
          prefix.slice(0, lastIncludeEnd) +
          "\n" +
          blocks.EXTINC.trim() +
          "\n" +
          prefix.slice(lastIncludeEnd);
      } else {
        // ไม่มี include เดิม -> แทรกไว้บนสุดของ prefix (แต่ยังคง prefix เดิม)
        newPrefix = blocks.EXTINC.trim() + "\n\n" + prefix;
      }
    }

    // 4.2) VARIABLE + FUNCTION -> แทรกก่อน setup() (ท้าย prefix) แบบไม่ตัดของเดิม
    const mid = [blocks.VARIABLE, blocks.FUNCTION].filter(Boolean).join("\n\n");
    if (mid) {
      newPrefix = stripEmptyLines(newPrefix + "\n\n" + mid) + "\n\n";
    }

    newPrefix = dedupeIncludes(newPrefix);
    newPrefix = dedupeByLine(newPrefix);

    s = newPrefix + rest;
  } else {
    // กรณีหา setup ไม่เจอ (แทบไม่เกิดเพราะ ensureFunc แล้ว) -> ต่อท้าย
    const topAll = [blocks.EXTINC, blocks.VARIABLE, blocks.FUNCTION]
      .filter(Boolean)
      .join("\n\n");
    if (topAll) s = stripEmptyLines(topAll + "\n\n" + s) + "\n";
  }

  // 5) เก็บความเรียบร้อย + format
  s = dedupeIncludes(s);
  s = stripEmptyLines(s) + "\n";
  s = formatByBraces(s).trim() + "\n";

  return s;
}