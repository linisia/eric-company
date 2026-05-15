import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Eric Company",
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
        // 라이트 — warm cream 배경에 차분히. 2색만.
        // Primary: #286983 짙은 청록 / Secondary: #797593 회보라
        lightMode: {
          light: "#faf4ed",
          lightgray: "#f2e9e1",
          gray: "#797593",
          darkgray: "#575279",
          dark: "#575279",
          secondary: "#286983",    // Primary 짙은 청록
          tertiary: "#797593",     // Secondary 회보라
          highlight: "rgba(40, 105, 131, 0.10)",
          textHighlight: "rgba(40, 105, 131, 0.20)",
        },
        // 다크 — 미드나잇 배경에 차분히. 2색만. (Eric 2026-05-15: 더 밝게)
        // Primary: #b8e0e7 밝은 청록 / Secondary: #b8b2cf 밝은 회보라
        darkMode: {
          light: "#1a1a2e",
          lightgray: "#22223a",
          gray: "#b8b2cf",
          darkgray: "#f0e6d2",
          dark: "#f5efe0",
          secondary: "#b8e0e7",    // Primary 밝은 청록 (was 9ccfd8)
          tertiary: "#b8b2cf",     // Secondary 밝은 회보라 (was 908caa)
          highlight: "rgba(184, 224, 231, 0.12)",
          textHighlight: "rgba(184, 224, 231, 0.22)",
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
