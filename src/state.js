let data ={
    currentLang: "python",
    code: "",
    parser: null,
    ast: null,
    lastAnalysisAt: null
};

function setLang(newLang){
    data.currentLang = newLang;
    console.log("Language changed to: ", newLang);
}

function setCode(newCode){
    data.code = newCode;
    console.log("Length of code: ", newCode.length);
}

function get(){
    return {
        currentLang: data.currentLang,
        code: data.code,
        parser: data.parser,
        ast: data.ast,
        lastAnalysisAt: data.lastAnalysisAt
    };
}

function setParser(parserInstance){
    data.parser = parserInstance;
    console.log("Parser ready");
}

function setAST(astInstance) {
    data.ast = astInstance;
    data.lastAnalysisAt = Date.now();

    if (astInstance && astInstance.rootNode && typeof astInstance.rootNode.descendantCount === "number") {
        console.log("AST ready with", astInstance.rootNode.descendantCount, "nodes");
    } else {
        console.log("AST ready");
    }
}

export { setLang, setCode, get, setParser, setAST };