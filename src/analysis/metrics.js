function measureLOC(code) {
  if (!code) return 0;
  return code.split('\n').filter(l => l.trim() !== '').length;
}

function measureFuncLOC(code, fnNode) {
  if (!fnNode) return 0;
  const text = code.slice(fnNode.startIndex, fnNode.endIndex);
  return text.split('\n').filter(l => l.trim() !== '').length;
}

function visit(node, fn) {
  const ret = fn(node);
  if (ret === false) return;
  for (let i = 0; i < node.namedChildCount; i++) {
    visit(node.namedChild(i), fn);
  }
}

function collect(node, predicate) {
  const results = [];
  visit(node, n => { if (predicate(n)) results.push(n); });
  return results;
}

function functionsIn(ast, lang) {
  const root = ast.rootNode;
  if (lang === 'python') {
    return collect(root, n => n.type === 'function_definition');
  }
  if (lang === 'javascript') {
    return collect(root, n =>
      n.type === 'function_declaration' ||
      n.type === 'method_definition' ||
      n.type === 'arrow_function' ||
      n.type === 'function' 
    );
  }
  if (lang === 'cpp') {
    return collect(root, n => n.type === 'function_definition');
  }
  return [];
}

function hasSelfCall(fnNode, name) {
  let found = false;
  visit(fnNode, n => {
    if (n.type === 'call_expression' || n.type === 'call') {
      for (let i = 0; i < n.namedChildCount; i++) {
        const c = n.namedChild(i);
        if (c.type === 'identifier' && c.text === name) {
          found = true;
          return false;
        }
      }
    }
  });
  return found;
}

function hasHalvingPattern(fnNode) {
  let halving = false;
  visit(fnNode, n => {
    if (n.type === 'binary_expression' || n.type === 'assignment_expression' || n.type === 'update_expression') {
      const txt = n.text || '';
      if (txt.includes('/ 2') || txt.includes('>> 1')) halving = true;
    }
  });
  return halving;
}

function countLoops(fnNode) {
  let loops = 0;
  visit(fnNode, n => {
    if (n.type === 'for_statement' || n.type === 'while_statement' || n.type === 'for_in_statement' || n.type === 'for_of_statement' || n.type === 'for_range_loop') {
      loops++;
    }
  });
  return loops;
}

function constantBoundLoop(fnNode) {
  let constant = false;
  visit(fnNode, n => {
    if (n.type === 'for_statement' || n.type === 'for_range_loop') {
      const txt = n.text || '';
      if (/\b<\s*\d+\b/.test(txt) || /\brange\s*\(\s*\d+\s*\)/.test(txt)) constant = true;
    }
  });
  return constant;
}

function guessParams(fnNode, lang) {
  const names = [];

  function findFirst(node, type) {
    if (!node) return null;
    if (node.type === type) return node;
    for (let i = 0; i < node.namedChildCount; i++) {
      const hit = findFirst(node.namedChild(i), type);
      if (hit) return hit;
    }
    return null;
  }

  if (lang === 'python') {
    const params = collect(fnNode, n => n.type === 'parameters')[0];
    if (!params) return names;
    for (let i = 0; i < params.namedChildCount; i++) {
      const p = params.namedChild(i);
      if (p.type === 'identifier') names.push(p.text);
    }
    return names;
  }

  if (lang === 'javascript') {
    const params = collect(fnNode, n => n.type === 'formal_parameters' || n.type === 'parameters')[0];
    if (!params) return names;
    for (let i = 0; i < params.namedChildCount; i++) {
      const p = params.namedChild(i);
      if (p.type === 'identifier' || p.type === 'pattern') {
        names.push(p.text);
      }
    }
    return names;
  }

  if (lang === 'cpp') {
    const funcDecl = findFirst(fnNode, 'function_declarator');
    const plist = funcDecl ? findFirst(funcDecl, 'parameter_list') : findFirst(fnNode, 'parameter_list');
    if (!plist) return names;
    for (let i = 0; i < plist.namedChildCount; i++) {
      const p = plist.namedChild(i);
      if (p.type === 'parameter_declaration') {
        const id = findFirst(p, 'identifier');
        names.push(id ? id.text : p.text);
      }
    }
    return names;
  }

  return names;
}

function estimateComplexity(fnNode, lang) {
  let bigO = 'O(1)', theta = 'Θ(1)', omega = 'Ω(1)';
  const notes = [];

  const loops = countLoops(fnNode);
  const hasConstantLoop = constantBoundLoop(fnNode);

  let name = '(anonymous)';
  for (let i = 0; i < fnNode.namedChildCount; i++) {
    const c = fnNode.namedChild(i);
    if (c.type === 'identifier') { name = c.text; break; }
  }

  const recursive = hasSelfCall(fnNode, name);

  if (recursive) {
    if (hasHalvingPattern(fnNode)) {
      bigO = 'O(log n)'; theta = 'Θ(log n)'; omega = 'Ω(log n)';
      notes.push('Recursive with halving input → logarithmic.');
    } else {
      bigO = 'O(n)'; theta = 'Θ(n)'; omega = 'Ω(1)';
      notes.push('Recursive; treating as linear unless halving is detected.');
    }
  } else if (loops >= 2) {
    bigO = 'O(n^2)'; theta = 'Θ(n^2)'; omega = 'Ω(n^2)';
    notes.push('Nested loops detected.');
  } else if (loops === 1) {
    if (hasConstantLoop) {
      bigO = 'O(1)'; theta = 'Θ(1)'; omega = 'Ω(1)';
      notes.push('Loop has constant upper bound.');
    } else if (hasHalvingPattern(fnNode)) {
      bigO = 'O(log n)'; theta = 'Θ(log n)'; omega = 'Ω(log n)';
      notes.push('Loop with halving step detected.');
    } else {
      bigO = 'O(n)'; theta = 'Θ(n)'; omega = 'Ω(1)';
      notes.push('Single loop over input.');
    }
  } else {
    bigO = 'O(1)'; theta = 'Θ(1)'; omega = 'Ω(1)';
  }

  return { bigO, theta, omega, notes };
}

export {
  functionsIn,
  measureLOC,
  measureFuncLOC,
  estimateComplexity,
  guessParams,
};
