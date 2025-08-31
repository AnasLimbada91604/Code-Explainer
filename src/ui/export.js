function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportMarkdown(rows, fileLoc, lang, issues, explanations) {
  const header = `# Analysis Report

- **Language:** ${lang}
- **File LOC:** ${fileLoc}
- **Functions:** ${rows.length}

`;

  const tableHead = `| Function | LOC | Big-O | Θ | Ω | Params |
|---|---:|---:|---:|---:|---:|
`;

  const tableBody = rows.map(r =>
    `| ${r.name} | ${r.loc} | ${r.bigO} | ${r.theta} | ${r.omega} | ${r.params} |`
  ).join('\n');

  const issuesMd = issues.length
    ? issues.map(i => `- **${i.severity.toUpperCase()}** — ${i.message}`).join('\n')
    : 'No issues found.';

  const explMd = explanations.map(e => {
    const notes = (e.notes || []).map(n => `  - ${n}`).join('\n');
    return `- ${e.text}${notes ? '\n' + notes : ''}`;
  }).join('\n');

  const md = `${header}
## Metrics
${tableHead}${tableBody}

## Issues
${issuesMd}

## Explanation
${explMd}
`;

  download('analysis.md', md, 'text/markdown');
}

function exportJSON(rows, fileLoc, lang, issues, explanations) {
  const payload = { lang, fileLoc, rows, issues, explanations, generatedAt: new Date().toISOString() };
  download('analysis.json', JSON.stringify(payload, null, 2), 'application/json');
}

export { exportMarkdown, exportJSON };
