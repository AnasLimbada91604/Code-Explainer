function runRules(row) {
  const out = [];

  if ((row.notes || []).some(n => /Recursive/.test(n)) &&
      !(row.notes || []).some(n => /base case/i.test(n))) {
    out.push({
      severity: 'warn',
      message: 'Recursive function without an obvious base case.'
    });
  }

  if (row.params >= 4) {
    out.push({
      severity: 'info',
      message: `Function has ${row.params} parameters — consider refactoring.`
    });
  }

  if ((row.notes || []).some(n => /constant upper bound/i.test(n))) {
    out.push({
      severity: 'info',
      message: 'Loop has constant bound — contributes O(1).'
    });
  }

  return out;
}

export { runRules };
