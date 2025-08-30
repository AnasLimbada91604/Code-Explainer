import { collect, visit, rangeOf } from '../parser/walk.js';

export function functionsIn(ast, lang) {
  if (!ast) return [];
  const root = ast.rootNode;

  if (lang === 'python') {
    return collect(root, n => n.type === 'function_definition');
  }
  if (lang === 'javascript') {
    return collect(root, n =>
      n.type === 'function_declaration' ||
      n.type === 'method_definition'
    );
  }
  if (lang === 'cpp') {
    return collect(root, n => n.type === 'function_definition');
  }
  return [];
}

// Whole-file LOC (non-empty lines)
export function measureLOC(src) {
  if (!src) return 0;
  return src.split(/\r?\n/).filter(l => l.trim().length > 0).length;
}

// Per-function LOC (node span)
export function measureFuncLOC(src, funcNode) {
  const { start, end } = rangeOf(funcNode);
  return end.row - start.row + 1;
}

// Helper: first child of a given type
function childOfType(node, type) {
  for (let i = 0; i < node.namedChildCount; i++) {
    const c = node.namedChild(i);
    if (c.type === type) return c;
  }
  return null;
}

// Helper: find identifier text in a subtree
function findIdentifier(node) {
  if (!node) return null;
  if (node.type === 'identifier') return node.text;
  for (let i = 0; i < node.namedChildCount; i++) {
    const t = findIdentifier(node.namedChild(i));
    if (t) return t;
  }
  return null;
}

// Guess parameter names by language
export function guessParams(funcNode, lang) {
  const names = [];

  if (lang === 'python') {
    const params = childOfType(funcNode, 'parameters');
    if (!params) return names;
    for (let i = 0; i < params.namedChildCount; i++) {
      const p = params.namedChild(i);
      if (p.type === 'identifier') {
        const txt = p.text;
        if (txt && txt !== 'self') names.push(txt);
      }
    }
    return names;
  }

  if (lang === 'javascript') {
    const params = childOfType(funcNode, 'formal_parameters');
    if (!params) return names;
    for (let i = 0; i < params.namedChildCount; i++) {
      const p = params.namedChild(i);
      if (p.type === 'identifier') {
        const txt = p.text;
        if (txt) names.push(txt);
      }
    }
    return names;
  }

  if (lang === 'cpp') {
    const params = childOfType(funcNode, 'parameter_list');
    if (!params) return names;
    for (let i = 0; i < params.namedChildCount; i++) {
      const p = params.namedChild(i);
      if (p.type === 'parameter_declaration') {
        const id = findIdentifier(p);
        if (id) names.push(id);
      }
    }
    return names;
  }

  return names;
}

// Cyclomatic complexity (simple, language-aware)
export function measureCyclomatic(funcNode, lang) {
  let cc = 1;

  const DECISION_TYPES = {
    python: new Set(['if_statement', 'elif_clause', 'for_statement', 'while_statement', 'except_clause']),
    javascript: new Set(['if_statement', 'for_statement', 'while_statement', 'do_statement', 'catch_clause', 'conditional_expression']),
    cpp: new Set(['if_statement', 'for_statement', 'while_statement'])
  };
  const SWITCH_CASE_TYPES = new Set(['switch_case']);

  const FUNCTION_NODE_TYPES = {
    python: new Set(['function_definition']),
    javascript: new Set(['function_declaration','method_definition','function_expression','arrow_function']),
    cpp: new Set(['function_definition','lambda_expression'])
  };

  const decisions = DECISION_TYPES[lang] || new Set();
  const fnNodes = FUNCTION_NODE_TYPES[lang] || new Set();

  visit(funcNode, (n) => {
    if (n !== funcNode && fnNodes.has(n.type)) return false; // don’t dive into nested functions
    if (decisions.has(n.type)) cc += 1;
    if (SWITCH_CASE_TYPES.has(n.type)) cc += 1;
    return true;
  });

  return cc;
}
