import { setLang, setCode, setParser, setAST, get } from './state.js';
import { initTS, createParser } from './parser/treesitter-loader.js';
import {
  functionsIn,
  measureLOC,
  measureFuncLOC,
  estimateComplexity,   
  guessParams
} from './analysis/metrics.js';
import { runRules } from './analysis/rules.js';
import { explainFunction } from './explain/explain.js';

const langEl        = document.getElementById('lang');
const analyzeEl     = document.getElementById('analyze');
const editorEl      = document.getElementById('editor');
const metricsEl     = document.getElementById('metrics');
const issuesEl      = document.getElementById('issues');
const explanationEl = document.getElementById('explanation');

const debounce = (fn, ms = 500) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

function findFirst(node, type) {
  if (!node) return null;
  if (node.type === type) return node;
  for (let i = 0; i < node.namedChildCount; i++) {
    const hit = findFirst(node.namedChild(i), type);
    if (hit) return hit;
  }
  return null;
}

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
    const stack = [fn];
    while (stack.length) {
      const n = stack.pop();
      if (n.type === 'identifier' || n.type === 'property_identifier') return n.text;
      for (let i = 0; i < n.namedChildCount; i++) stack.push(n.namedChild(i));
    }
    return '(anonymous)';
  }

  if (lang === 'cpp') {
    const funcDecl = findFirst(fn, 'function_declarator');
    if (funcDecl) {
      const innerDecl = findFirst(funcDecl, 'declarator');
      const ident = innerDecl ? findFirst(innerDecl, 'identifier') : findFirst(funcDecl, 'identifier');
      if (ident) return ident.text;
    }
    const stack = [fn];
    while (stack.length) {
      const n = stack.pop();
      if (n.type === 'identifier') return n.text;
      for (let i = 0; i < n.namedChildCount; i++) stack.push(n.namedChild(i));
    }
    return '(anonymous)';
  }

  return '(anonymous)';
}

function renderMetricsTable(rows, fileLoc, lang, elapsedMs) {
  const body = rows.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.loc}</td>
      <td>${r.bigO}</td>
      <td>${r.theta}</td>
      <td>${r.omega}</td>
      <td>${r.params}</td>
    </tr>
  `).join('');

  metricsEl.innerHTML = `
    <table class="metrics">
      <caption>Language: ${lang}</caption>
      <thead>
        <tr>
          <th>Function</th><th>LOC</th><th>Big-O</th><th>Θ</th><th>Ω</th><th>Params</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
      <tfoot>
        <tr>
          <td colspan="6">File LOC: ${fileLoc} • Analyzed in ${elapsedMs} ms • functions: ${rows.length}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

function persist() {
  try {
    localStorage.setItem('code', editorEl.value || '');
    localStorage.setItem('lang', langEl.value || 'python');
  } catch {}
}

async function analyzeNow() {
  try {
    const parser = get('parser');
    if (!parser) {
      metricsEl.textContent = 'No parser loaded.';
      issuesEl.textContent = '';
      explanationEl.textContent = '';
      return;
    }

    const code = editorEl.value ?? '';
    setCode(code);

    const t0 = performance.now();
    const tree = parser.parse(code);
    const elapsedParse = Math.max(0, Math.round(performance.now() - t0));
    setAST(tree);

    const lang = get('currentLang');
    const funcs = functionsIn(tree, lang);

    if (funcs.length === 0) {
      renderMetricsTable([], measureLOC(code), lang, elapsedParse);
      renderExportButtons([], measureLOC(code), lang, []);
      issuesEl.innerHTML = `<div class="issue info">No functions detected.</div>`;
      explanationEl.textContent = '';
      return;
    }

    const rows = funcs.map(fn => {
      const name   = nameFor(fn, lang);
      const loc    = measureFuncLOC(code, fn);
      const params = (guessParams(fn, lang) || []).length;
      const { bigO, theta, omega, notes = [] } = estimateComplexity(fn, lang);
      return { name, loc, params, bigO, theta, omega, notes };
    });

    const fileLoc = measureLOC(code);
    renderMetricsTable(rows, fileLoc, lang, elapsedParse);

    const allIssues = rows.flatMap(r => runRules(r));
    renderExportButtons(rows, fileLoc, lang, allIssues);

    explanationEl.innerHTML = `
      <ul class="explanations">
        ${rows.map(r => {
          const warnText = r.notes && r.notes.length ? ` Warnings: ${r.notes.join(' ')}` : '';
          const bullets = (r.notes || []).map(n => `<li class="subnote">${n}</li>`).join('');
          return `
            <li>
              ${explainFunction({
                name: r.name,
                loc: r.loc,
                params: r.params,
                bigO: r.bigO
              })}${warnText}
              ${bullets ? `<ul class="notes">${bullets}</ul>` : ''}
            </li>`;
        }).join('')}
      </ul>
    `;

  } catch (err) {
    console.error('Analyze failed:', err);
    metricsEl.textContent = 'Analyze failed. Check console.';
    issuesEl.textContent = '';
    explanationEl.textContent = '';
  }
}

function renderExportButtons(rows, fileLoc, lang, allIssues) {
  const exportBtns = `
    <div class="export-btns">
      <button id="btnExportMd">Export Markdown</button>
      <button id="btnExportJson">Export JSON</button>
    </div>
  `;
  const issuesHtml = allIssues.length
    ? allIssues.map(i =>
        `<div class="issue ${i.severity === 'warn' ? 'warn' : 'info'}">
           <strong>${i.severity.toUpperCase()}</strong> — ${i.message}
         </div>`
      ).join('')
    : 'No issues found.';

  issuesEl.innerHTML = exportBtns + issuesHtml;

  const toExplArr = rows.map(r => ({
    text: `Function "${r.name}" is ${r.loc} lines long, has ${r.params} parameter(s), and estimated complexities: ${r.bigO}, ${r.theta}, ${r.omega}.`,
    notes: r.notes || []
  }));

  const hook = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);

  hook('btnExportMd', async () => {
    const m = await import('./ui/export.js');
    m.exportMarkdown(rows, fileLoc, lang, allIssues, toExplArr);
  });

  hook('btnExportJson', async () => {
    const m = await import('./ui/export.js');
    m.exportJSON(rows, fileLoc, lang, allIssues, toExplArr);
  });
}

async function boot() {
  await initTS();

  try {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) langEl.value = savedLang;
    setLang(langEl.value);

    const savedCode = localStorage.getItem('code');
    if (savedCode) editorEl.value = savedCode;
    else if (!editorEl.value) editorEl.value = 'def add(a, b):\n    return a + b\n';
  } catch {
    setLang(langEl.value);
  }

  try {
    const parser = await createParser(langEl.value);
    setParser(parser);
  } catch (e) {
    console.error('Failed to init parser:', e);
    metricsEl.innerHTML = `
      <div class="inline-error">
        Failed to load parser. Try reselecting the language or refreshing.
      </div>`;
    return;
  }

  await analyzeNow();
}
boot();

editorEl.addEventListener('input', debounce(() => {
  persist();
  analyzeNow();
}, 600));

analyzeEl.addEventListener('click', analyzeNow);

langEl.addEventListener('change', async () => {
  const newValue = langEl.value;
  setLang(newValue);
  persist();
  try {
    const p = await createParser(newValue);
    setParser(p);
    await analyzeNow();
  } catch (err) {
    console.error('Failed to load parser:', err);
    metricsEl.textContent = 'Error loading parser';
    issuesEl.textContent = '';
    explanationEl.textContent = '';
  }
});

editorEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyzeNow();
  if (e.key === 'Escape') editorEl.focus();
});
