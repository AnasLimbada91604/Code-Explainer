import { LANGUAGES } from './languages.js';

let initialized = false;
const loadedLanguages = new Map();

async function ensureRuntime() {
  if (window.TreeSitter) return;
  await import('../../vendor/web-tree-sitter.js');
}

export async function initTS() {
  if (initialized) return;
  await ensureRuntime();
  if (!window.TreeSitter || !window.TreeSitter.init) {
    throw new Error('web-tree-sitter script not loaded. Check index.html script tags.');
  }
  await window.TreeSitter.init();
  initialized = true;
}

export async function createParser(langId) {
  if (!initialized) throw new Error('Tree-sitter not initialized');
  const cfg = LANGUAGES[langId];
  if (!cfg) throw new Error(`Unknown language: ${langId}`);

  let Language = loadedLanguages.get(langId);
  if (!Language) {
    Language = await window.TreeSitter.Language.load(cfg.wasmPath);
    loadedLanguages.set(langId, Language);
  }
  const parser = new window.TreeSitter();
  parser.setLanguage(Language);
  return parser;
}
