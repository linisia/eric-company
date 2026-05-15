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
        // 다크 — 미드나잇 배경에 차분히. 2색만.
        // Primary: #9ccfd8 부드러운 청록 / Secondary: #908caa 회보라
        darkMode: {
          light: "#1a1a2e",
          lightgray: "#22223a",
          gray: "#908caa",
          darkgray: "#f0e6d2",
          dark: "#f5efe0",
          secondary: "#9ccfd8",    // Primary 청록
          tertiary: "#908caa",     // Secondary 회보라
          highlight: "rgba(156, 207, 216, 0.10)",
          textHighlight: "rgba(156, 207, 216, 0.20)",
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
