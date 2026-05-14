#!/usr/bin/env node
// Drive Vault → Quartz content 동기화 + 공개 게이트.
// log/{x}.md 의 ## #N 섹션 단위로 메타.공개 파싱.
//   public/없음 → 포함, password → 본문 제거 후 자리만, private → 섹션 제외.
// soul/{x}.md, templates/worklog.md 는 단순 복사 (공개 게이트 적용 안 함 — 운영 문서).

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const VAULT = process.env.ERIC_VAULT
  ?? path.join(
    os.homedir(),
    "Library/CloudStorage/GoogleDrive-linisian@gmail.com",
    "내 드라이브/Obsidian/Aloys/eric_company",
  );
const QUARTZ_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CONTENT = path.join(QUARTZ_ROOT, "content");

const CODES = ["a", "b", "c", "d"];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readVault(rel) {
  return fs.readFileSync(path.join(VAULT, rel), "utf8");
}

function writeContent(rel, body) {
  const out = path.join(CONTENT, rel);
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, body);
}

// 워크로그를 # 헤더(타이틀) + ## #N 섹션들로 split.
// 첫 ## #N 앞 prefix는 그대로 보존, 각 섹션은 메타.공개에 따라 처리.
function processWorklog(raw, code) {
  const lines = raw.split("\n");
  const sections = [];
  let preface = [];
  let current = null;
  const headerRe = /^## #(\d+)\s+/;

  for (const line of lines) {
    if (headerRe.test(line)) {
      if (current) sections.push(current);
      else preface = preface.slice();
      current = { header: line, n: Number(line.match(headerRe)[1]), body: [] };
    } else if (current) {
      current.body.push(line);
    } else {
      preface.push(line);
    }
  }
  if (current) sections.push(current);

  const counts = { public: 0, password: 0, private: 0 };
  const kept = [];
  for (const s of sections) {
    const visibility = detectVisibility(s.body);
    counts[visibility] += 1;
    if (visibility === "private") continue;
    if (visibility === "password") {
      kept.push(renderPasswordPlaceholder(s));
    } else {
      kept.push([s.header, ...s.body].join("\n"));
    }
  }

  const out = [preface.join("\n").replace(/\n+$/, ""), "", ...kept].join("\n");
  return { out, counts };
}

function detectVisibility(bodyLines) {
  // 섹션 안에서 마지막 "- 공개: …" 라인을 정답으로.
  let v = "public"; // 메타 누락 = v1 양식 → public 기본
  const re = /^\s*-\s*공개\s*:\s*(public|password|private)\b/i;
  for (const ln of bodyLines) {
    const m = ln.match(re);
    if (m) v = m[1].toLowerCase();
  }
  return v;
}

function renderPasswordPlaceholder(s) {
  // 본문 제거. 메타·헤더 라인은 유지 (페이지 자리 + 분기 검증용).
  const metaStart = s.body.findIndex(l => /^###\s*메타/.test(l));
  const metaBlock = metaStart >= 0 ? s.body.slice(metaStart) : [];
  return [
    s.header,
    "",
    "> 🔒 비공개 콘텐츠 — 비밀번호 필요 (Phase 4 staticrypt 적용 예정)",
    "",
    ...metaBlock,
  ].join("\n");
}

function copyPlain(src, dest) {
  const raw = readVault(src);
  writeContent(dest, raw);
}

function main() {
  // 기존 content 비우기 (.gitkeep 보존).
  if (fs.existsSync(CONTENT)) {
    for (const e of fs.readdirSync(CONTENT)) {
      if (e === ".gitkeep") continue;
      fs.rmSync(path.join(CONTENT, e), { recursive: true, force: true });
    }
  }
  ensureDir(CONTENT);

  // index — 사이트 첫 페이지.
  writeContent(
    "index.md",
    [
      "---",
      "title: Eric Company",
      "---",
      "",
      "# Eric Company",
      "",
      "4계정 다중 에이전트 운영 일지.",
      "",
      "## 부원 워크로그",
      "- [박사원](worklogs/a)",
      "- [김부장](worklogs/b)",
      "- [최대리](worklogs/c)",
      "- [이과장](worklogs/d)",
      "",
      "## SOUL",
      "- [a](souls/a) · [b](souls/b) · [c](souls/c) · [d](souls/d)",
      "",
      "## 운영 자료",
      "- [워크로그 템플릿](meta/worklog-template)",
      "",
    ].join("\n"),
  );

  const summary = [];
  for (const code of CODES) {
    const raw = readVault(`log/${code}.md`);
    const { out, counts } = processWorklog(raw, code);
    writeContent(`worklogs/${code}.md`, out);
    summary.push(
      `worklogs/${code}.md  public:${counts.public}  password:${counts.password}  private:${counts.private}`,
    );
  }

  for (const code of CODES) copyPlain(`soul/${code}.md`, `souls/${code}.md`);
  copyPlain("templates/worklog.md", "meta/worklog-template.md");

  console.log("[sync-content] done");
  for (const ln of summary) console.log("  " + ln);
}

main();
