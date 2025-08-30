import { LANGUAGES } from './languages.js';

let initialized = false;
const loadedLanguages = new Map();

export async function initTS() {
  if (initialized) return;
  // Point the runtime to your local core wasm (tree-sitter.wasm) in /vendor
  await window.TreeSitter.init({
    locateFile: (name) => `./vendor/${name}`
  });
  initialized = true;
}

export async function createParser(langId) {
  if (!initialized) {
    throw new Error('Tree-sitter not initialized');
  }
  const lang = LANGUAGES[langId];
  if (!lang) throw new Error(`Unknown language: ${langId}`);

  // Cache loaded grammars so we don’t fetch wasm repeatedly
  const cached = loadedLanguages.get(langId);
  const Language = cached || await window.TreeSitter.Language.load(lang.wasmPath);
  if (!cached) loadedLanguages.set(langId, Language);

  const parser = new window.TreeSitter();
  parser.setLanguage(Language);
  return parser;
}
