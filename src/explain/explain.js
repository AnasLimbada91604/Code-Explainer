// src/explain/explain.js
function explainFunction(row) {
  const name   = row?.name ?? '(anonymous)';
  const loc    = row?.loc ?? 0;
  const params = row?.params ?? 0;
  const bigO   = row?.bigO ?? 'O(1)';

  let s = `Function “${name}” is ${loc} lines long, has ${params} parameter${params === 1 ? '' : 's'}, and estimated time complexity ${bigO}.`;

  if (row?.notes && row.notes.length) {
    s += ` Warnings: ${row.notes.join(' ')}.`;
  }
  return s;
}

export { explainFunction };
