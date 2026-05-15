#!/usr/bin/env node
// T-C-106 step-β: content/worklogs/{x}.md 를
//   content/worklogs/{x}/index.md  (에피소드 리스트)
//   content/worklogs/{x}/{N}.md    (편당 분리)
// 로 변환. 한 번만 실행하고 원본 {x}.md 는 삭제.
//
// 사용법:
//   node scripts/split-worklogs.mjs              # 실제 분리
//   node scripts/split-worklogs.mjs --dry-run    # 결과만 로그
//   node scripts/split-worklogs.mjs --keep       # 원본 {x}.md 유지

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const KEEP = args.includes("--keep");

const QUARTZ_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const WORKLOGS = path.join(QUARTZ_ROOT, "content", "worklogs");

const AGENT_META = {
  a: { name: "박사원", rank: "사원", role: "신규 도구·MCP 실험·기록 정리 담당." },
  b: { name: "김부장", rank: "부장", role: "큐 분배·결재·broker 운영 총괄." },
  c: { name: "최대리", rank: "대리", role: "실무 에이스 — 스크립트·파이프라인·빌드 실행." },
  d: { name: "이과장", rank: "과장", role: "콘텐츠 가공·디자인·외부 노출 파트." },
};

function splitEpisodes(raw) {
  // `## #N ` 헤더 단위로 분리. 본문 첫 헤더 위 영역은 무시(파일 머리말).
  const lines = raw.split("\n");
  const headerRe = /^## #(\d+)\s+(.*)$/;
  const episodes = [];
  let cur = null;
  for (const ln of lines) {
    const m = ln.match(headerRe);
    if (m) {
      if (cur) episodes.push(cur);
      cur = { n: Number(m[1]), title: m[2].trim(), lines: [ln] };
    } else if (cur) {
      cur.lines.push(ln);
    }
  }
  if (cur) episodes.push(cur);
  // 본문 끝 `---` 트레일링 줄 제거.
  for (const ep of episodes) {
    while (ep.lines.length && ep.lines[ep.lines.length - 1].trim() === "") ep.lines.pop();
    if (ep.lines.length && ep.lines[ep.lines.length - 1].trim() === "---") ep.lines.pop();
    while (ep.lines.length && ep.lines[ep.lines.length - 1].trim() === "") ep.lines.pop();
  }
  return episodes;
}

function extractDate(body) {
  const m = body.match(/^- 일자:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/m);
  return m ? m[1] : null;
}

function escapeYaml(s) {
  // 큰따옴표 안전하게.
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildEpisodeFile(ep) {
  const body = ep.lines.join("\n");
  const date = extractDate(body);
  const titleRaw = `#${ep.n} ${ep.title}`;
  const fm = [
    "---",
    `title: "${escapeYaml(titleRaw)}"`,
    date ? `date: ${date}` : null,
    "tags:",
    "  - worklog",
    "---",
    "",
  ].filter(Boolean).join("\n");
  return fm + "\n" + body + "\n";
}

function buildIndex(agent, episodes) {
  const meta = AGENT_META[agent];
  const sorted = [...episodes].sort((a, b) => b.n - a.n); // 최신 위
  const cards = sorted.map(ep => {
    const body = ep.lines.join("\n");
    const date = extractDate(body) || "—";
    return `- [#${ep.n} ${ep.title}](${ep.n}) · ${date}`;
  }).join("\n");
  return [
    "---",
    `title: ${meta.name} 워크로그`,
    "tags:",
    "  - meta",
    "---",
    "",
    `# ${meta.name} (${agent.toUpperCase()}) 워크로그`,
    "",
    `${meta.rank} · ${meta.role}`,
    "",
    "## 에피소드",
    "",
    cards,
    "",
  ].join("\n");
}

function main() {
  const out = { agents: [], errors: [] };
  for (const agent of Object.keys(AGENT_META)) {
    const src = path.join(WORKLOGS, `${agent}.md`);
    if (!fs.existsSync(src)) {
      out.errors.push(`${agent}: ${src} not found — skip`);
      continue;
    }
    const raw = fs.readFileSync(src, "utf8");
    const episodes = splitEpisodes(raw);
    if (!episodes.length) {
      out.errors.push(`${agent}: 에피소드 0편 — skip`);
      continue;
    }
    const dir = path.join(WORKLOGS, agent);
    if (!DRY) fs.mkdirSync(dir, { recursive: true });

    for (const ep of episodes) {
      const target = path.join(dir, `${ep.n}.md`);
      const content = buildEpisodeFile(ep);
      if (DRY) {
        console.log(`[dry] ${agent}/${ep.n}.md (${content.length}B)`);
      } else {
        fs.writeFileSync(target, content);
      }
    }
    const indexPath = path.join(dir, "index.md");
    const indexContent = buildIndex(agent, episodes);
    if (DRY) {
      console.log(`[dry] ${agent}/index.md (${episodes.length}편)`);
    } else {
      fs.writeFileSync(indexPath, indexContent);
    }

    if (!DRY && !KEEP) {
      fs.unlinkSync(src);
    }

    out.agents.push({ agent, episodes: episodes.length });
  }
  console.log("---");
  for (const a of out.agents) console.log(`${a.agent}: ${a.episodes}편`);
  if (out.errors.length) {
    console.log("errors:");
    for (const e of out.errors) console.log("  - " + e);
  }
}

main();
