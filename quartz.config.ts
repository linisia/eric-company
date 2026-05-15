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
        // Rose-Pine Dawn — 외부 일기 톤 (warm cream BG + muted lavender text)
        lightMode: {
          light: "#faf4ed",        // rp-base
          lightgray: "#f2e9e1",    // rp-overlay (호버·구분)
          gray: "#9893a5",         // rp-muted
          darkgray: "#797593",     // rp-subtle
          dark: "#575279",         // rp-text
          secondary: "#907aa9",    // rp-iris (링크)
          tertiary: "#286983",     // rp-pine (보조)
          highlight: "rgba(234, 157, 52, 0.15)",
          textHighlight: "rgba(234, 157, 52, 0.35)",
        },
        // 자체 다크 — 미드나잇 네이비 + warm cream
        darkMode: {
          light: "#1a1a2e",        // ec-dark-bg
          lightgray: "#22223a",    // ec-dark-bg-mute
          gray: "#787090",         // ec-dark-text-subtle
          darkgray: "#a8a0b8",     // ec-dark-text-muted
          dark: "#f0e6d2",         // ec-dark-text (warm cream)
          secondary: "#c896c0",    // 이과장 플럼 (다크 링크)
          tertiary: "#e8b96b",     // 박사원 골드 (다크 보조)
          highlight: "rgba(232, 185, 107, 0.15)",
          textHighlight: "rgba(232, 185, 107, 0.35)",
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
