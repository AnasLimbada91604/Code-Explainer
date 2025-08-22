## Overview
Code Explainer is a **static analysis and explanation tool** that runs entirely in your browser.  
Paste code (Python/JavaScript for MVP), and it will:
Parse the code into an AST using [tree-sitter](https://tree-sitter.github.io/tree-sitter/).
- Generate **natural-language explanations** of functions, loops, and control flow.
- Compute **metrics**: cyclomatic complexity, nesting depth, lines of code.
- Detect **common bugs/smells** (unused vars, shadowing, off-by-one, mutable defaults, etc.).
- Export a **shareable report** (Markdown or PDF).

No servers, no paid APIs — everything happens client-side.

---

## Demo
[Insert live link once deployed]  

---

## Features
- **Multi-language (MVP)**: Python & JavaScript
- **Metrics panel**: function-by-function complexity
- **Issues panel**: rule engine with fix hints
- **Explanation panel**: plain-English summaries
- **Export**: one-page report (Markdown/PDF)

---

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Parsing**: [web-tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web)
- **Editor**: `<textarea>` (MVP), CodeMirror optional
- **Export**: Markdown (Blob download), PDF (print stylesheet)

---

## Project Structure
code-explainer/
├─ index.html
├─ styles/
│  └─ main.css
├─ src/
│  ├─ main.js                 # bootstraps UI, wires events
│  ├─ state.js                # central app state (current code, lang, results)
│  ├─ parser/
│  │  ├─ treesitter-loader.js # init tree-sitter & load grammars
│  │  ├─ walk.js              # AST walk helpers (visitors)
│  │  └─ languages.js         # language registry (id, display, loader)
│  ├─ analysis/
│  │  ├─ metrics.js           # cyclomatic, nesting, LOC
│  │  ├─ complexity.js        # Big-O heuristics
│  │  └─ rules.js             # bug/smell rules
│  ├─ explain/
│  │  └─ explain.js           # template-based natural language generator
│  ├─ ui/
│  │  ├─ editor.js            # CodeMirror or <textarea> integration
│  │  ├─ results.js           # render metrics, issues, explanation
│  │  └─ export.js            # export to PDF/Markdown
│  └─ util/
│     ├─ debounce.js
│     └─ dom.js
├─ vendor/
│  ├─ web-tree-sitter.js
│  ├─ tree-sitter-python.wasm
│  └─ tree-sitter-javascript.wasm
└─ docs/
   ├─ architecture.md
   ├─ README.md
   └─ rules.md

## Usage

Paste code into the editor.

Select a language (Python or JavaScript).

Click Analyze to view metrics, issues, and explanation.

Click Export to download a report.
