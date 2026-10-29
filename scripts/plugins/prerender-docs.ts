import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { renderHtml } from '@tanstack/markdown/html';
import { createHighlighter } from '@tanstack/highlight/core';
import { js } from '@tanstack/highlight/languages/js';
import { plaintext } from '@tanstack/highlight/languages/plaintext';
import { createTanStackMarkdownHighlighter } from '@tanstack/highlight/markdown';
import { createThemeCss } from '@tanstack/highlight/theme';
import { githubDarkTheme } from '@tanstack/highlight/themes/github-dark';
import { githubLightTheme } from '@tanstack/highlight/themes/github-light';
import { generateKeywordColors } from '../../src/lib/colors.ts';
import type { FrontMatterUniversalType } from '../../src/types/mdx.ts';

const CONTENT_DIR = path.resolve(import.meta.dirname, '../../src/assets/content');

const DOCS_ID = 'virtual:docs';
const BODY_PREFIX = 'virtual:docs-body/';
const CSS_ID = 'virtual:docs-highlight.css';

const highlightCode = createTanStackMarkdownHighlighter(
  createHighlighter({ languages: [plaintext, js], fallbackLanguage: 'plaintext' }),
);

/**
 * Splits a content file into its front matter (key: value lines) and markdown body
 */
function parseEntry(filename: string, source: string): { matter: FrontMatterUniversalType; body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`Missing front matter in ${filename}`);
  }

  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (line.trim() === '' || separator < 0) continue;

    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replaceAll("'", '');
  }

  const matter = {
    ...fields,
    index: parseInt(fields.index),
    filename,
    slug: filename.replace(/\.md$/, ''),
  } as unknown as FrontMatterUniversalType;

  return { matter, body: match[2] };
}

function readEntries() {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => parseEntry(file, fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8')))
    .sort((a, b) => a.matter.index - b.matter.index);
}

/**
 * Renders the docs index: metadata, keyword colors, and a lazy loader per entry body
 */
function buildDocsModule(): string {
  const entries = readEntries();
  const matters = entries.map((entry) => entry.matter);
  const loaders = matters
    .map((matter) => `  ${JSON.stringify(matter.slug)}: () => import(${JSON.stringify(BODY_PREFIX + matter.slug)})`)
    .join(',\n');

  return [
    `export const AllFrontMatter = ${JSON.stringify(matters)};`,
    `export const AllKeywordsArray = ${JSON.stringify(generateKeywordColors(matters))};`,
    `export const loadBody = {\n${loaders}\n};`,
  ].join('\n');
}

function buildBodyModule(slug: string): string | undefined {
  const file = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return undefined;

  const { body } = parseEntry(`${slug}.md`, fs.readFileSync(file, 'utf8'));
  return `export default ${JSON.stringify(renderHtml(body, { highlighter: highlightCode }))};`;
}

function buildHighlightCss(): string {
  return createThemeCss({
    light: githubLightTheme,
    dark: githubDarkTheme,
    lightSelector: '.doc-content',
    darkSelector: '.dark .doc-content',
    codeBlockSelector: '.doc-content pre.tm-code',
  });
}

/**
 * Pre-renders documentation markdown to HTML at build time so the app ships
 * finished markup (with highlighted code) instead of parsing markdown at runtime.
 */
export const prerenderDocsPlugin: Plugin = {
  name: 'prerender-docs',
  resolveId(id) {
    if (id === DOCS_ID || id === CSS_ID) return `\0${id}`;
    if (id.startsWith(BODY_PREFIX)) return `\0${id}`;
    return undefined;
  },
  load(id) {
    if (id === `\0${DOCS_ID}`) return buildDocsModule();
    if (id === `\0${CSS_ID}`) return buildHighlightCss();
    if (id.startsWith(`\0${BODY_PREFIX}`)) return buildBodyModule(id.slice(`\0${BODY_PREFIX}`.length));
    return undefined;
  },
  handleHotUpdate({ file, server }) {
    if (file.startsWith(CONTENT_DIR) && file.endsWith('.md')) {
      for (const id of [`\0${DOCS_ID}`, `\0${CSS_ID}`]) {
        const mod = server.moduleGraph.getModuleById(id);
        if (mod) server.moduleGraph.invalidateModule(mod);
      }
      server.ws.send({ type: 'full-reload' });
      return [];
    }
    return undefined;
  },
};
