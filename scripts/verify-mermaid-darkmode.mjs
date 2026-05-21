// 다크모드 mermaid 가시성 시각 검증.
// quartz dev server (port 8765) 가동 상태에서 실행.
//
// 사용:
//   node scripts/verify-mermaid-darkmode.mjs
//
// 출력: /tmp/mermaid-verify/{page}-{theme}.png

import puppeteer from "puppeteer-core"
import { mkdirSync } from "node:fs"

const CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const BASE = "http://localhost:8765"
const PAGES = [
  { slug: "diary/c/1", id: "c1" },
  { slug: "diary/a/15", id: "a15" },
  { slug: "diary/b/15", id: "b15" },
  { slug: "diary/b/16", id: "b16" },
]
const OUT_DIR = "/tmp/mermaid-verify"

mkdirSync(OUT_DIR, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME_BIN,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1400,2400"],
  defaultViewport: { width: 1400, height: 2400, deviceScaleFactor: 2 },
})

async function capture(slug, id, theme) {
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }])

  // localStorage에 theme 박은 채로 첫 로드 — quartz darkmode.inline.ts가 즉시 읽음.
  await page.evaluateOnNewDocument((t) => {
    try {
      localStorage.setItem("theme", t)
    } catch {}
  }, theme)

  await page.goto(`${BASE}/${slug}`, { waitUntil: "networkidle0", timeout: 30000 })

  // mermaid SVG가 등장할 때까지 대기 (최대 12초).
  try {
    await page.waitForFunction(
      () => document.querySelectorAll("code.mermaid svg").length > 0,
      { timeout: 12000 },
    )
  } catch {
    // 본문에 mermaid 없을 수도. 진행.
  }
  // 안정화 약간 더.
  await new Promise((r) => setTimeout(r, 1500))

  const fname = `${OUT_DIR}/${id}-${theme}.png`
  await page.screenshot({ path: fname, fullPage: true })

  // 추가 메타: saved-theme · mermaid 노드 개수 · mermaid 텍스트/배경 cssVar 표본
  const meta = await page.evaluate(() => {
    const root = document.documentElement
    const savedTheme = root.getAttribute("saved-theme")
    const nodes = document.querySelectorAll("code.mermaid svg")
    const sample = []
    for (const svg of nodes) {
      const rect = svg.querySelector("g.node rect, g.node polygon, g.node ellipse")
      const text = svg.querySelector(".nodeLabel, foreignObject span")
      if (rect && text) {
        sample.push({
          fill: getComputedStyle(rect).fill,
          textColor: getComputedStyle(text).color,
        })
        if (sample.length >= 3) break
      }
    }
    return { savedTheme, mermaidCount: nodes.length, sample }
  })
  await page.close()
  return { fname, meta }
}

const results = []
for (const p of PAGES) {
  for (const theme of ["light", "dark"]) {
    const r = await capture(p.slug, p.id, theme)
    results.push({ page: p.id, theme, ...r })
    console.log(`✓ ${p.id} ${theme} → ${r.fname}  saved-theme=${r.meta.savedTheme}  mermaid=${r.meta.mermaidCount}`)
    for (const s of r.meta.sample) {
      console.log(`   fill=${s.fill}  text=${s.textColor}`)
    }
  }
}

await browser.close()
console.log("\nDONE")
