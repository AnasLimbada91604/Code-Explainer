import { setLang, setCode, setParser, setAST, get } from './state.js';
import { initTS, createParser } from './parser/treesitter-loader.js';
import { functionsIn, guessParams, measureLoc, measureCyclomatic } from './analysis/metrics.js';

const langEl = document.getElementById('lang');
const analyzeEl = document.getElementById('analyze');
const editorEl = document.getElementById('editor');
const metricsEl = document.getElementById('metrics');

const pad = (s, n) => (String(s) + ' '.repeat(n)).slice(0, n);

function nameFor(fn, lang) {
  if (lang === 'python') {
    for (let i = 0; i < fn.namedChildCount; i++) {
      const c = fn.namedChild(i);
      if (c.type === 'identifier') return c.text;
    }
    return '(anonymous)';
  }

  if (lang === 'javascript') {
    for (let i = 0; i < fn.namedChildCount; i++) {
      const c = fn.namedChild(i);
      if (c.type === 'identifier' || c.type === 'property_identifier') return c.text;
    }
    return '(anonymous)';
  }

  if (lang === 'cpp') {
    const stack = [fn];
    while (stack.length) {
      const n = stack.pop();
      if (n.type === 'identifier') return n.text;
      for (let i = 0; i < n.namedChildCount; i++) {
        stack.push(n.namedChild(i));
      }
    }
    return '(anonymous)';
  }

  return '(anonymous)';
}

async function boot() {
  await initTS();
  setLang(langEl.value);
  const parser = await createParser(langEl.value);
  setParser(parser);
  // optional: seed editor with sample code
  editorEl.value = 'def add(a,b):\n    return a+b\n';
}
boot();

langEl.addEventListener('change', async () => {
  const newValue = langEl.value;
  setLang(newValue);
  const p = await createParser(newValue);
  setParser(p);
  metricsEl.textContent = `Language loaded: ${newValue}`;
  console.log('Language loaded:', newValue);
});

analyzeEl.addEventListener('click', async () => {
  const src = editorEl.value || '';
  setCode(src);

  const p = get().parser;
  if (!p) {
    metricsEl.textContent = 'No parser loaded. Pick a language first.';
    return;
  }

  try {
    const tree = p.parse(get().code);
    setAST(tree);

    const ast = get().ast;
    const lang = get().currentLang;
    const funcs = functionsIn(ast, lang);

    if (funcs.length === 0) {
      metricsEl.textContent = 'No functions detected.';
      return;
    }

    const rows = funcs.map(fn => {
      return {
        name: nameFor(fn, lang),
        loc: measureLoc(editorEl.value, fn),
        cc: measureCyclomatic(fn, lang),
        params: guessParams(fn, lang).length
      };
    });

    const header = `${pad('Function', 22)}  ${pad('LOC', 4)}  ${pad('CC', 4)}  ${pad('Params', 6)}`;
    const lines = rows.map(r =>
      `${pad(r.name, 22)}  ${pad(r.loc, 4)}  ${pad(r.cc, 4)}  ${pad(r.params, 6)}`
    );
    metricsEl.textContent = [header, ...lines].join('\n');
  } catch (err) {
    console.error(err);
    metricsEl.textContent = `Parse error: ${err.message || err}`;
  }
});