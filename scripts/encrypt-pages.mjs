#!/usr/bin/env node
// encrypt-pages.mjs
// encrypted-paths.json 매니페스트의 paths(정적) + patterns(글롭) 으로 매칭된 public/ 산하
// HTML 파일을 staticrypt 로 in-place 암호화. 호출 순서: quartz build → encrypt-pages.
//
// 매니페스트 스키마:
//   {
//     "paths":    ["fixtures/password.html"],       // public/ 기준 정적 경로
//     "patterns": ["worklogs/**/*.html"]            // public/ 기준 globby 패턴
//   }
//
// 옵션:
//   --dry-run   매칭 파일만 출력, 암호화 X (SITE_PASSWORD 없어도 OK)

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { globby } from "globby";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "encrypted-paths.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const TMP_DIR = path.join(ROOT, ".staticrypt-tmp");

const DRY = process.argv.includes("--dry-run");

if (!fs.existsSync(MANIFEST)) {
  console.log("[encrypt-pages] manifest 없음 — skip.");
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
const staticPaths = Array.isArray(manifest.paths) ? manifest.paths : [];
const patterns = Array.isArray(manifest.patterns) ? manifest.patterns : [];

// 정적 paths 는 존재 여부와 무관하게 그대로 큐에. 패턴은 public/ 기준으로 globby 풀이.
const fromPatterns = patterns.length
  ? await globby(patterns, { cwd: PUBLIC_DIR, onlyFiles: true })
  : [];

// 중복 제거 + 안정 정렬.
const merged = Array.from(new Set([...staticPaths, ...fromPatterns])).sort();

if (merged.length === 0) {
  console.log("[encrypt-pages] 보호 대상 0건 — skip.");
  process.exit(0);
}

if (DRY) {
  console.log(`[encrypt-pages:dry-run] 매칭 ${merged.length} 건:`);
  for (const rel of merged) console.log(`  - ${rel}`);
  console.log(`[encrypt-pages:dry-run] 종료. 실제 암호화는 SITE_PASSWORD 세팅 후 --dry-run 빼고 호출.`);
  process.exit(0);
}

const password = process.env.SITE_PASSWORD;
if (!password) {
  console.error(
    `[encrypt-pages] SITE_PASSWORD env 필수 (보호 페이지 ${merged.length}건 대기).`,
  );
  process.exit(1);
}

fs.rmSync(TMP_DIR, { recursive: true, force: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

let processed = 0;
for (const rel of merged) {
  const target = path.join(PUBLIC_DIR, rel);
  if (!fs.existsSync(target)) {
    console.warn(`[encrypt-pages] missing → skip: ${rel}`);
    continue;
  }

  execFileSync(
    "npx",
    [
      "staticrypt",
      target,
      "-d",
      TMP_DIR,
      "--short",
      "--template-title",
      "보호된 페이지",
      "--template-instructions",
      "비밀번호를 입력하세요",
      "--template-color-primary",
      "#f0e6d2",
      "--template-color-secondary",
      "#1c1c2e",
      "-p",
      password,
    ],
    { stdio: "inherit", cwd: ROOT, env: process.env },
  );

  const baseName = path.basename(target);
  const encrypted = path.join(TMP_DIR, baseName);
  if (!fs.existsSync(encrypted)) {
    console.error(`[encrypt-pages] staticrypt 출력 없음: ${encrypted}`);
    process.exit(1);
  }

  fs.copyFileSync(encrypted, target);
  console.log(`[encrypt-pages] ✅ ${rel}`);
  processed += 1;
}

fs.rmSync(TMP_DIR, { recursive: true, force: true });
console.log(`[encrypt-pages] 완료 — ${processed}/${merged.length} 페이지 암호화.`);

// 안전망: 매니페스트는 매칭됐는데 실제 처리가 0건 = 출력 경로 구조 불일치(폴더+index.html vs 평면 등).
// CI 가 초록색·사이트는 평문인 사고를 빌드 단계에서 빨간색으로 잡음.
if (processed === 0 && merged.length > 0) {
  console.error(
    `[encrypt-pages] 🚨 보호 대상 ${merged.length}건 매칭됐지만 처리 0건. ` +
      `매니페스트 patterns vs 빌드 출력 경로 불일치 의심. 매니페스트·Quartz layout 점검.`,
  );
  process.exit(1);
}
