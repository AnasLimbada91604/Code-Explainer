import { collect, rangeOf, visit } from '../parser/walk.js';

function functionsIn(ast, lang){
    if(lang === "python"){
        return collect(ast.rootNode, n=> n.type === "function_definition");
    }

    if(lang === "javascript"){
        return collect(ast.rootNode, n=> n.type === "function_definition" || n.type === "method_definition");
    }

    if(lang === "cpp"){
        return collect(ast.rootNode, n => n.type === "function_definition")
    }

    else{
        return [];
    }
}

function childOfType(node, type){
    for(let i = 0; i< node.namedChildCount;i++){
        const c = node.namedChildCount(i);
        if(c.type === type){
            return c;
        }
    }
    return null;
}

function findIdentifier(node) {
  if (!node) return null;
  if (node.type === 'identifier') return node;
  for (let i = 0; i < node.namedChildCount; i++) {
    const found = findIdentifier(node.namedChild(i));
    if (found) return found;
  }
  return null;
}

function guessParams(funcNode, lang) {
  const names = [];

  if (lang === 'python') {
    const params = childOfType(funcNode, 'parameters');
    if (!params) return names;
    for (let i = 0; i < params.namedChildCount; i++) {
      const p = params.namedChild(i);
      if (p.type === 'identifier') {
        const text = p.text ?? null;
        if (text && text !== 'self') names.push(text);
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
        const text = p.text ?? null;
        if (text) names.push(text);
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
        if (id && id.text) names.push(id.text);
      }
    }
    return names;
  }

  return names;
}

function measureLoc(src, funcNode){
    const {start, end} = rangeOf(funcNode);
    const loc = end.row - start.row + 1;
    return loc < 0 ? 0: loc;
}

const DECISION_TYPES = {
  python: new Set(['if_statement', 'elif_clause', 'for_statement', 'while_statement', 'except_clause']),
  javascript: new Set(['if_statement', 'for_statement', 'while_statement', 'do_statement', 'catch_clause', 'conditional_expression']),
  cpp: new Set(['if_statement', 'for_statement', 'while_statement']),
};

const SWITCH_CASE_TYPES = new Set(['switch_case']); // JS & C++

const FUNCTION_NODE_TYPES = {
  python: new Set(['function_definition']),
  javascript: new Set(['function_declaration', 'method_definition', 'function_expression', 'arrow_function']),
  cpp: new Set(['function_definition', 'lambda_expression']),
};

function measureCyclomatic(funcNode, lang) {
  let cc = 1; 
  const decisions = DECISION_TYPES[lang] || new Set();
  const fnNodes = FUNCTION_NODE_TYPES[lang] || new Set();

  visit(funcNode, (n) => {
    if (n !== funcNode && fnNodes.has(n.type)) return false;

    if (decisions.has(n.type)) cc += 1;

    if (SWITCH_CASE_TYPES.has(n.type)) cc += 1;

    return true;
  });

  return cc;
}

export {functionsIn, guessParams, measureLoc, measureCyclomatic};