import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Quartz 4",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "quartz.jzhao.xyz",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        // 라이트 모드 — Rose-Pine Dawn 배경 + Eric 정한 컬러 시스템
        // Primary 1: #4A6CFA 로얄 블루 (메인 브랜드·링크)
        // Primary 2: #FF6B6B 소프트 코랄 (강조·CTA)
        // Secondary: #20C997 민트 (보조·태그)
        lightMode: {
          light: "#faf4ed",        // rp-base (warm cream BG)
          lightgray: "#f2e9e1",    // rp-overlay (호버·구분)
          gray: "#797593",         // rp-subtle (was muted — 가독성 ↑)
          darkgray: "#575279",     // rp-text (사이드바 본문과 같게)
          dark: "#575279",         // rp-text (본문)
          secondary: "#4A6CFA",    // Primary 1 로얄 블루 (링크)
          tertiary: "#20C997",     // Secondary 민트 (보조)
          highlight: "rgba(255, 107, 107, 0.15)",  // 코랄 base
          textHighlight: "rgba(255, 107, 107, 0.35)",
        },
        // 다크 모드 — 미드나잇 + Eric 정한 컬러 시스템
        // Primary 1: #7950F2 비비드 퍼플 (메인 브랜드·링크)
        // Primary 2: #F59F00 웜 앰버 (강조·CTA)
        // Secondary: #339AF0 스카이 블루 (보조·태그)
        darkMode: {
          light: "#1a1a2e",        // ec-dark-bg
          lightgray: "#22223a",    // ec-dark-bg-mute
          gray: "#a8a0b8",         // 사이드바 흐림 방지 — 더 밝게
          darkgray: "#f0e6d2",     // 사이드바 본문과 같게 (was a8a0b8)
          dark: "#f5efe0",         // 본문 — 가독성 ↑ (was f0e6d2)
          secondary: "#7950F2",    // Primary 1 비비드 퍼플 (다크 링크)
          tertiary: "#339AF0",     // Secondary 스카이 블루 (보조)
          highlight: "rgba(245, 159, 0, 0.15)",  // 앰버 base
          textHighlight: "rgba(245, 159, 0, 0.35)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false, parseTags: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
