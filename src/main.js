import { setLang, setCode, setParser, setAST, get } from './state.js';
import { initTS, createParser } from './parser/treesitter-loader.js';
import {
  functionsIn,
  measureLOC,
  measureFuncLOC,
  measureCyclomatic,
  guessParams
} from './analysis/metrics.js';
import { runRules } from './analysis/rules.js';
import { explainFunction } from './explain/explain.js';

const langEl = document.getElementById('lang');
const analyzeEl = document.getElementById('analyze');
const editorEl = document.getElementById('editor');
const metricsEl = document.getElementById('metrics');
const issuesEl = document.getElementById('issues');
const explanationEl = document.getElementById('explanation');

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
      for (let i = 0; i < n.namedChildCount; i++) stack.push(n.namedChild(i));
    }
    return '(anonymous)';
  }
  return '(anonymous)';
}

/** Renders a proper metrics table with header + footer */
function renderMetricsTable(rows, fileLoc, lang) {
  const body = rows.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.loc}</td>
      <td>${r.cc}</td>
      <td>${r.params}</td>
    </tr>
  `).join('');

  metricsEl.innerHTML = `
    <table class="metrics">
      <caption>Language: ${lang}</caption>
      <thead>
        <tr>
          <th>Function</th>
          <th>LOC</th>
          <th>CC</th>
          <th>Params</th>
        </tr>
      </thead>
      <tbody>
        ${body}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4">File LOC: ${fileLoc}</td>
        </tr>
      </tfoot>
    </table>
  `;
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

    const tree = parser.parse(code);
    setAST(tree);

    const lang = get('currentLang');
    const funcs = functionsIn(tree, lang);

    if (funcs.length === 0) {
      metricsEl.textContent = 'No functions detected.';
      issuesEl.textContent = '';
      explanationEl.textContent = '';
      return;
    }

    const rows = funcs.map(fn => ({
      name: nameFor(fn, lang),
      loc: measureFuncLOC(code, fn),
      cc: measureCyclomatic(fn, lang),
      params: guessParams(fn, lang).length,
    }));

    // Metrics table
    const fileLoc = measureLOC(code);
    renderMetricsTable(rows, fileLoc, lang);

    // Issues (keep simple text for now)
    const allIssues = rows.flatMap(r => runRules(r));
    issuesEl.textContent = allIssues.length
      ? allIssues.map(i => `${i.severity === 'warn' ? '[WARN]' : '[INFO]'} ${i.message}`).join('\n')
      : 'No issues found.';

    // Explanations as bullet list
    explanationEl.innerHTML = `
      <ul class="explanations">
        ${rows.map(r => `<li>${explainFunction(r)}</li>`).join('')}
      </ul>
    `;
  } catch (err) {
    console.error('Analyze failed:', err);
    metricsEl.textContent = 'Analyze failed. Check console.';
    issuesEl.textContent = '';
    explanationEl.textContent = '';
  }
}

async function boot() {
  await initTS();
  setLang(langEl.value);
  const parser = await createParser(langEl.value);
  setParser(parser);

  // Optional starter snippet
  if (!editorEl.value) {
    editorEl.value = 'def add(a, b):\n    return a + b\n';
  }
}
boot();

// Keep code in state
editorEl.addEventListener('input', () => { setCode(editorEl.value); });

// Analyze button
analyzeEl.addEventListener('click', analyzeNow);

// Re-load parser on language change, then re-analyze
langEl.addEventListener('change', async () => {
  const newValue = langEl.value;
  setLang(newValue);
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

// Ctrl/Cmd+Enter shortcut
editorEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyzeNow();
});
