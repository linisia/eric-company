// Explorer 사이드바에 worklogs 폴더 노출 + search/graph는 worklogs 미노출 검증.

import puppeteer from "puppeteer-core"
import { mkdirSync } from "node:fs"

const CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const BASE = "http://localhost:8765"
const OUT_DIR = "/tmp/mermaid-verify"
mkdirSync(OUT_DIR, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME_BIN,
  headless: "new",
  args: ["--no-sandbox"],
  defaultViewport: { width: 1400, height: 1800, deviceScaleFactor: 2 },
})

// 1) Explorer 트리 확인 + 워크로그 펼친 캡처
{
  const page = await browser.newPage()
  await page.goto(`${BASE}/diary/c/1`, { waitUntil: "networkidle0" })
  await new Promise((r) => setTimeout(r, 1500))

  // 워크로그 폴더 펼치기 (folder-title 텍스트로 매칭)
  await page.evaluate(() => {
    document.querySelector(".explorer-content")?.setAttribute("aria-expanded", "true")
    for (const btn of document.querySelectorAll(".folder-button")) {
      const title = btn.querySelector(".folder-title")?.textContent?.trim() ?? ""
      if (title.includes("워크로그") || title.includes("worklogs") || title === "a" || title === "b" || title === "c" || title === "d" || title === "업무일지") {
        btn.click()
      }
    }
  })
  await new Promise((r) => setTimeout(r, 500))
  // 두 번째 패스 — 자식 폴더(a,b,c,d) 펼치기 (워크로그 펼친 후 등장)
  await page.evaluate(() => {
    for (const btn of document.querySelectorAll(".folder-button")) {
      const title = btn.querySelector(".folder-title")?.textContent?.trim() ?? ""
      if (["a", "b", "c", "d"].includes(title)) {
        btn.click()
      }
    }
  })
  await new Promise((r) => setTimeout(r, 800))

  const sidebar = await page.$(".left.sidebar")
  if (sidebar) {
    await sidebar.screenshot({ path: `${OUT_DIR}/explorer-expanded.png` })
    console.log("✓ explorer-expanded.png")
  }

  // 사이드바 안 워크로그 자식 링크 개수
  const diag = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll(".left.sidebar a"))
    const hrefs = links.map((a) => a.getAttribute("href") ?? "")
    return {
      total: hrefs.length,
      worklogLinks: hrefs.filter((h) => h.includes("worklogs/")).length,
      worklogSample: hrefs.filter((h) => h.includes("worklogs/")).slice(0, 5),
    }
  })
  console.log("sidebar links:", JSON.stringify(diag, null, 2))
  await page.close()
}

// 2) search · graph는 worklogs 미노출
{
  const page = await browser.newPage()
  await page.goto(`${BASE}/diary/c/1`, { waitUntil: "networkidle0" })
  await new Promise((r) => setTimeout(r, 1000))
  // 검색 모달 데이터: fetchData는 inline script로 정의 (const). 직접 fetch로 확인.
  const counts = await page.evaluate(async () => {
    const cd = await fetch("/static/contentIndex.json").then((r) => r.json())
    const ex = await fetch("/static/explorerIndex.json").then((r) => r.json())
    return {
      content: { total: Object.keys(cd).length, worklogs: Object.keys(cd).filter((s) => s.startsWith("worklogs/")).length },
      explorer: { total: Object.keys(ex).length, worklogs: Object.keys(ex).filter((s) => s.startsWith("worklogs/")).length },
    }
  })
  console.log("index counts:", JSON.stringify(counts, null, 2))
  await page.close()
}

// 3) staticrypt 비번 게이트 — 워크로그 페이지 직접 진입 시 비번 입력 화면
{
  const page = await browser.newPage()
  await page.goto(`${BASE}/worklogs/c/1`, { waitUntil: "networkidle0" }).catch(() => {})
  await new Promise((r) => setTimeout(r, 1000))
  const has = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return {
      hasPasswordInput: !!document.querySelector('input[type="password"]'),
      bodySnippet: text.slice(0, 200),
    }
  })
  console.log("worklog page:", JSON.stringify(has, null, 2))
  await page.screenshot({ path: `${OUT_DIR}/worklog-gate.png`, fullPage: false })
  console.log("✓ worklog-gate.png")
  await page.close()
}

await browser.close()
console.log("DONE")
