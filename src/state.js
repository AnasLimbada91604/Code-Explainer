const data = {
  currentLang: 'python',
  code: '',
  parser: null,
  ast: null,
  lastAnalysisAt: null,
};

function setLang(newLang) { data.currentLang = newLang; }
function setCode(newCode) { data.code = newCode; }
function setParser(p)     { data.parser = p; }
function setAST(ast)      { data.ast = ast; data.lastAnalysisAt = Date.now(); }
function get(key)         { return data[key]; }

export { setLang, setCode, setParser, setAST, get };
