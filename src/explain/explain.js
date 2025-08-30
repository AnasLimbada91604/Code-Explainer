function gradeComplexity(cc) {
  if (cc <= 3) return 'simple';
  if (cc <= 7) return 'moderate';
  if (cc <= 12) return 'complex';
  return 'very complex';
}
export function explainFunction(m) {
  const label = gradeComplexity(m.cc);
  const paramWord = m.params === 1 ? 'parameter' : 'parameters';
  return `Function “${m.name}” is ${m.loc} lines long, has ${m.params} ${paramWord}, and a cyclomatic complexity of ${m.cc} (${label}).`;
}
