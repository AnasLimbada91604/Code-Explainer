function visit(node, fn) {
  const res = fn(node);
  if (res === false) return;
  for (let i = 0; i < node.namedChildCount; i++) {
    const child = node.namedChild(i);
    visit(child, fn);
  }
}

function collect(node, predicate) {
  const results = [];
  visit(node, n => { if (predicate(n)) results.push(n); });
  return results;
}

function rangeOf(node) {
  return { start: node.startPosition, end: node.endPosition };
}

export { visit, collect, rangeOf };
