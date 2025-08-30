export const THRESHOLDS = {
  LONG_FUNC_LOC: 30,
  HIGH_CC: 10,
  MANY_PARAMS: 5,
};

export function runRules(m) {
  const issues = [];

  if (m.loc > THRESHOLDS.LONG_FUNC_LOC) {
    issues.push({
      rule: 'long-function',
      severity: 'info',
      message: `“${m.name}” is long (${m.loc} LOC). Consider extracting helpers.`,
    });
  }

  if (m.params > THRESHOLDS.MANY_PARAMS) {
    issues.push({
      rule: 'too-many-params',
      severity: 'warn',
      message: `“${m.name}” has ${m.params} parameters. Consider grouping.`,
    });
  }

  if (m.cc > THRESHOLDS.HIGH_CC) {
    issues.push({
      rule: 'high-complexity',
      severity: 'warn',
      message: `“${m.name}” has high cyclomatic complexity (${m.cc}).`,
    });
  }

  return issues;
}
