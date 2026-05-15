#!/usr/bin/env node
// T-C-104 / T-C-106 step-β: publish_pending/*.md (Eric 결재로 status:approved 갈음한 워크로그) 를
// content/worklogs/{agent}/{N}.md 로 분리 출력. {agent}/index.md 의 에피소드 카드 리스트도 갱신.
//
//   - status:approved 만 게이트 통과 (draft·기타 skip)
//   - sanitizer.py 직전 검열 — redacted/keyword 있으면 sync skip + 결재요청 리스트로 남김
//   - 멱등: 동일 `{agent}/{N}.md` 파일이 이미 있으면 skip
//   - 트리거: 로컬 수동 (cron·hook 은 별 안건)
//
// 사용법:
//   node scripts/sync-from-pending.mjs                 # 실제 sync
//   node scripts/sync-from-pending.mjs --dry-run       # 무변경, 게이트 결과 로그만
//   node scripts/sync-from-pending.mjs --auto-commit   # sync 후 content/ git add + commit (push X)
//   node scripts/sync-from-pending.mjs --vault PATH    # vault 경로 override

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const AUTO_COMMIT = args.includes("--auto-commit");
const VAULT = (() => {
  const i = args.indexOf("--vault");
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return (
    process.env.ERIC_VAULT
    ?? path.join(
      os.homedir(),
      "Library/CloudStorage/GoogleDrive-linisian@gmail.com",
      "내 드라이브/Obsidian/Aloys/eric_company",
    )
  );
})();
const QUARTZ_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CONTENT_WORKLOGS = path.join(QUARTZ_ROOT, "content", "worklogs");
const PENDING_DIR = path.join(VAULT, "publish_pending");
const SANITIZER = path.join(VAULT, "scripts", "sanitizer.py");

const AGENTS = new Set(["a", "b", "c", "d"]);

const AGENT_META = {
  a: { name: "박사원", rank: "사원", role: "신규 도구·MCP 실험·기록 정리 담당." },
  b: { name: "김부장", rank: "부장", role: "큐 분배·결재·broker 운영 총괄." },
  c: { name: "최대리", rank: "대리", role: "실무 에이스 — 스크립트·파이프라인·빌드 실행." },
  d: { name: "이과장", rank: "과장", role: "콘텐츠 가공·디자인·외부 노출 파트." },
};

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 4);
  if (end < 0) return { meta: {}, body: raw };
  const block = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const meta = {};
  for (const ln of block.split("\n")) {
    const m = ln.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*(#.*)?$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    meta[m[1]] = v;
  }
  return { meta, body };
}

function ensureN(body, n) {
  // 본문에서 `## #N ` 으로 시작하는 첫 헤더부터 다음 ## #M 직전까지 추출.
  const lines = body.split("\n");
  const re = new RegExp(`^## #${n}(\\s|$)`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) return null;
  let endIdx = lines.length;
  const nextRe = /^## #\d+(\s|$)/;
  for (let i = start + 1; i < lines.length; i++) {
    if (nextRe.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(start, endIdx).join("\n").replace(/\n+$/, "");
}

function runSanitizer(filePath) {
  // 입력 파일을 그대로 sanitize. 리포트 stderr, sanitized 본문 stdout.
  if (!fs.existsSync(SANITIZER)) {
    return { ok: false, reason: `sanitizer.py not found: ${SANITIZER}` };
  }
  const r = spawnSync("python3", [SANITIZER, filePath, "--report"], { encoding: "utf8" });
  if (r.status !== 0) {
    return { ok: false, reason: `sanitizer exit ${r.status}: ${(r.stderr || r.stdout || "").trim()}` };
  }
  const report = (r.stdout || "") + (r.stderr || "");
  // sanitizer 리포트 양식: `redact: 없음` / `기밀 키워드 경고: 없음` 이면 통과.
  // "없음" 외 내용이 붙으면 flagged.
  // `\s+` 로 두지 않으면 백트래킹으로 negative lookahead 무력화됨 (T-C-106 step-γ 디버그)
  const redactHit = /^redact:\s+(?!없음\s*$).+/m.test(report);
  const keywordHit = /^기밀 키워드 경고:\s+(?!없음\s*$).+/m.test(report);
  return { ok: true, flagged: redactHit || keywordHit, report };
}

function escapeYaml(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function extractDate(body) {
  const m = body.match(/^- 일자:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/m);
  return m ? m[1] : null;
}

function extractEpisodeTitle(section) {
  // section 첫 줄: `## #N 🛠️ 제목`
  const first = section.split("\n", 1)[0] || "";
  const m = first.match(/^## #(\d+)\s+(.*)$/);
  return m ? m[2].trim() : "";
}

function buildEpisodeFile(section, n) {
  const title = extractEpisodeTitle(section);
  const date = extractDate(section);
  const titleRaw = `#${n} ${title}`;
  const fm = [
    "---",
    `title: "${escapeYaml(titleRaw)}"`,
    date ? `date: ${date}` : null,
    "tags:",
    "  - worklog",
    "---",
    "",
  ].filter(Boolean).join("\n");
  return fm + "\n" + section + "\n";
}

function refreshAgentIndex(agentDir, agent) {
  // agentDir 안 N.md 들 훑어 카드 리스트 재생성. index.md 덮어쓰기.
  const files = fs.existsSync(agentDir)
    ? fs.readdirSync(agentDir).filter(f => /^\d+\.md$/.test(f))
    : [];
  const entries = files.map(f => {
    const n = Number(f.replace(/\.md$/, ""));
    const raw = fs.readFileSync(path.join(agentDir, f), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const title = extractEpisodeTitle(body) || (meta.title || "").replace(/^#\d+\s*/, "");
    const date = (meta.date || extractDate(body) || "—").trim();
    return { n, title, date };
  }).sort((a, b) => b.n - a.n);

  const meta = AGENT_META[agent];
  const cards = entries.map(e => `- [#${e.n} ${e.title}](${e.n}) · ${e.date}`).join("\n");
  const out = [
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
  fs.writeFileSync(path.join(agentDir, "index.md"), out);
}

function autoCommit(syncedCount) {
  // push 안 함. add + commit 만. Eric/김부장이 수동 push.
  if (syncedCount <= 0) {
    console.log("[auto-commit] 0건이라 commit skip");
    return;
  }
  const cwd = QUARTZ_ROOT;
  const add = spawnSync("git", ["add", "content/"], { cwd, encoding: "utf8" });
  if (add.status !== 0) {
    console.error(`[auto-commit] git add 실패: ${(add.stderr || "").trim()}`);
    return;
  }
  const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd });
  if (diff.status === 0) {
    console.log("[auto-commit] staged diff 없음 — commit skip");
    return;
  }
  const msg = `publish: sync ${syncedCount} drafts (auto)`;
  const commit = spawnSync("git", ["commit", "-m", msg], { cwd, encoding: "utf8" });
  if (commit.status !== 0) {
    console.error(`[auto-commit] git commit 실패: ${(commit.stderr || commit.stdout || "").trim()}`);
    return;
  }
  console.log(`[auto-commit] commit OK — "${msg}" (push는 수동)`);
}

function main() {
  if (!fs.existsSync(PENDING_DIR)) {
    console.error(`[sync-from-pending] publish_pending not found: ${PENDING_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(PENDING_DIR).filter(f => f.endsWith(".md")).sort();

  const tally = { scanned: 0, approved: 0, synced: 0, skipped_idempotent: 0, skipped_sanitizer: 0, errors: [] };
  const approvalsNeeded = [];

  for (const f of files) {
    tally.scanned += 1;
    const full = path.join(PENDING_DIR, f);
    const raw = fs.readFileSync(full, "utf8");
    const { meta, body } = parseFrontmatter(raw);

    const status = (meta.status || "").toLowerCase();
    if (status !== "approved") continue;

    tally.approved += 1;
    const agent = (meta.agent || "").toLowerCase();
    const n = Number(meta.episode);
    if (!AGENTS.has(agent) || !Number.isInteger(n) || n <= 0) {
      tally.errors.push(`${f}: bad meta (agent=${agent}, episode=${meta.episode})`);
      continue;
    }

    const agentDir = path.join(CONTENT_WORKLOGS, agent);
    const targetPath = path.join(agentDir, `${n}.md`);
    if (fs.existsSync(targetPath)) {
      tally.skipped_idempotent += 1;
      console.log(`[skip:idempotent] ${f} → ${agent}/${n}.md already exists`);
      continue;
    }

    const san = runSanitizer(full);
    if (!san.ok) {
      tally.errors.push(`${f}: ${san.reason}`);
      continue;
    }
    if (san.flagged) {
      tally.skipped_sanitizer += 1;
      approvalsNeeded.push({ file: f, agent, n, report: san.report.split("\n").slice(0, 6).join("\n") });
      console.log(`[skip:sanitizer] ${f} flagged — 결재요청 후보`);
      continue;
    }

    const section = ensureN(body, n);
    if (!section) {
      tally.errors.push(`${f}: ## #${n} 본문 추출 실패`);
      continue;
    }

    if (DRY) {
      console.log(`[dry-run:would-sync] ${f} → ${agent}/${n}.md (${section.length} bytes)`);
    } else {
      fs.mkdirSync(agentDir, { recursive: true });
      fs.writeFileSync(targetPath, buildEpisodeFile(section, n));
      refreshAgentIndex(agentDir, agent);
      console.log(`[sync] ${f} → ${agent}/${n}.md`);
    }
    tally.synced += 1;
  }

  console.log("---");
  console.log(`scanned=${tally.scanned} approved=${tally.approved} synced=${tally.synced} dry=${DRY}`);
  console.log(`skipped(idempotent)=${tally.skipped_idempotent} skipped(sanitizer)=${tally.skipped_sanitizer}`);
  if (tally.errors.length) {
    console.log("errors:");
    for (const e of tally.errors) console.log("  - " + e);
  }
  if (approvalsNeeded.length) {
    console.log("결재요청 후보 (sanitizer flagged):");
    for (const a of approvalsNeeded) console.log(`  - ${a.file} (#${a.n}, ${a.agent})`);
  }
  if (tally.approved === 0) console.log("approved 0건 — 실제 sync 없음.");

  if (AUTO_COMMIT) {
    if (DRY) {
      console.log("[auto-commit] --dry-run 이라 commit 미실행");
    } else {
      autoCommit(tally.synced);
    }
  }
}

main();
