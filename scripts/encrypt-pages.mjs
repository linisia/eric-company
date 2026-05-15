#!/usr/bin/env node
// encrypt-pages.mjs
// encrypted-paths.json 매니페스트의 각 페이지를 staticrypt로 in-place 암호화.
// 비번은 SITE_PASSWORD env. 호출 순서: quartz build → encrypt-pages.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "encrypted-paths.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const TMP_DIR = path.join(ROOT, ".staticrypt-tmp");

if (!fs.existsSync(MANIFEST)) {
  console.log("[encrypt-pages] manifest 없음 — skip.");
  process.exit(0);
}

const { paths: pages = [] } = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
if (pages.length === 0) {
  console.log("[encrypt-pages] password 페이지 0건 — skip.");
  process.exit(0);
}

const password = process.env.SITE_PASSWORD;
if (!password) {
  console.error(
    `[encrypt-pages] SITE_PASSWORD env 필수 (보호 페이지 ${pages.length}건 대기).`,
  );
  process.exit(1);
}

fs.rmSync(TMP_DIR, { recursive: true, force: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

let processed = 0;
for (const rel of pages) {
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
      "Eric Company · 보호된 페이지",
      "--template-instructions",
      "비밀번호 필요. Eric/김부장께 문의.",
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
console.log(`[encrypt-pages] 완료 — ${processed}/${pages.length} 페이지 암호화.`);
