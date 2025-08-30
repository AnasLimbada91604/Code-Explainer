let data = {
  currentLang: "python",
  code: "",
  parser: null,
  ast: null,
  lastAnalysisAt: null
};

function setLang(newLang) {
  data.currentLang = newLang;
}

function setCode(newCode) {
  data.code = newCode;
}

function setParser(parserInstance) {
  data.parser = parserInstance;
}

function setAST(astInstance) {
  data.ast = astInstance;
  data.lastAnalysisAt = Date.now();
}

function get(key) {
  return key ? data[key] : data;
}

export { setLang, setCode, setParser, setAST, get };
