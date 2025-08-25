import { setLang, setCode, setParser, setAST, get } from './state.js';
import { initTS, createParser } from './parser/treesitter-loader.js';

const langEl = document.getElementById('lang');
const analyzeEl = document.getElementById('analyze');
const editorEl = document.getElementById('editor');
const metricsEl = document.getElementById('metrics');

export async function boot(){
  await initTS();
  setLang(langEl.value);
  const parser = await createParser(langEl.value);
  setParser(parser);
}
boot();
langEl.addEventListener('change', async () =>{
  const newValue = langEl.value;
  setLang(newValue);
  const p = await createParser(newValue);
  setParser(p);
  metricsEl.textContent = `Language loaded: ${newValue}`;
  console.log('Language loaded: ', newValue)
}
);

analyzeEl.addEventListener('click', async ()=>{
  const src = editorEl.value || '';
  setCode(src);

  const p = get().parser;
  if (!p){
    metricsEl.textContent = 'No parser loaded. Pick a language first.';
    return;
  }

  try{
    const tree = p.parse(get().code);
    setAST(tree);
    metricsEl.textContent = `Parsed successfully: ${tree.rootNode.descendantCount} nodes`;
  }
  catch (err){
    console.error(err);
    metricsEl.textContent = `Parse erro`
  }
});
