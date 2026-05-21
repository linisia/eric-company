// 다크모드에서 mermaid 블록만 clipping해 zoom screenshot.
// 글자 가독성 detail까지 확인 가능.

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
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1600,2400"],
  defaultViewport: { width: 1600, height: 2400, deviceScaleFactor: 2 },
})

for (const p of PAGES) {
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }])
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("theme", "dark")
    } catch {}
  })
  await page.goto(`${BASE}/${p.slug}`, { waitUntil: "networkidle0", timeout: 30000 })
  try {
    await page.waitForFunction(() => document.querySelectorAll("code.mermaid svg").length > 0, {
      timeout: 12000,
    })
  } catch {}
  await new Promise((r) => setTimeout(r, 1500))

  const codes = await page.$$("code.mermaid")
  for (let i = 0; i < codes.length; i++) {
    const fname = `${OUT_DIR}/zoom-${p.id}-${i + 1}.png`
    await codes[i].screenshot({ path: fname })
    console.log(`✓ ${fname}`)
  }
  await page.close()
}

await browser.close()
console.log("DONE")
