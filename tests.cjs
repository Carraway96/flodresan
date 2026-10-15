// Kör med node tests.cjs. Ingen nätverksanslutning eller externa paket krävs.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {TERMS,CATEGORIES}=require('./data.js');
assert.equal(TERMS.length,36);
assert.equal(new Set(TERMS.map(t=>t.id)).size,TERMS.length);
for(const term of TERMS){
  assert.match(term.id,/^[a-z]+$/);
  for(const field of ['term','definition','pages','example'])assert.ok(term[field]?.trim(),`${term.id}: ${field}`);
  assert.ok(CATEGORIES[term.category]);
}
function boot(saved='{}',blocked=false){
  const nodes=new Map();
  const node=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{value:selector==='#length'?'10':selector==='#category'?'all':'',checked:false,textContent:'',innerHTML:'',hidden:false,dataset:{},classList:{toggle(){}},setAttribute(){},focus(){},querySelector:node,querySelectorAll:()=>[]});
    return nodes.get(selector);
  };
  const store={value:saved};
  const context=vm.createContext({console,document:{querySelector:node,querySelectorAll:()=>[]},localStorage:{getItem(){if(blocked)throw Error('blocked');return store.value;},setItem(key,value){if(blocked)throw Error('blocked');store.value=value;}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),context);
  return {run:code=>vm.runInContext(code,context),node,store};
}
let app=boot();
assert.equal(app.run('session.length'),10);
assert.equal(app.run('new Set(session.map(t=>t.id)).size'),10);
app.run("record('farao',true);record('farao',true)");
assert.equal(app.node('#progress-count').textContent,'1 / 36');
app.run("record('farao',false)");
assert.equal(app.node('#review-count').textContent,1);
assert.equal(app.node('#progress-count').textContent,'0 / 36');
app.node('#review-only').checked=true;
assert.equal(app.run('eligible().length'),1);
app.run('start()');
assert.equal(app.run('session.length'),1);
assert.equal(app.run('session[0].id'),'farao');
const restored=boot(app.store.value);
assert.equal(restored.node('#review-count').textContent,1);
restored.run("record('farao',true)");
assert.equal(restored.node('#review-count').textContent,0);
assert.equal(restored.node('#progress-count').textContent,'0 / 36');
restored.run("record('farao',true)");
assert.equal(restored.node('#progress-count').textContent,'1 / 36');
app.node('#review-only').checked=false;
app.node('#category').value='culture';
app.node('#length').value='36';
app.run('start()');
assert.equal(app.run('session.length'),12);
assert.equal(app.run("session.every(t=>t.category==='culture')"),true);
app.run('mode="match";start();selectedTerm=round[0].id;selectedDefinition=round[1].id;choosePair("definition",selectedDefinition)');
const mistake=app.run('round[0].id');
app.run('selectedTerm=round[0].id;selectedDefinition=round[0].id;choosePair("definition",selectedDefinition)');
assert.equal(app.run(`progress['${mistake}'].review`),true,'Rätt par efter ett fel ska finnas kvar för repetition.');
assert.equal(app.run('matched.size'),1);
assert.equal(boot('not json').run('Object.keys(progress).length'),0);
assert.equal(boot('{"farao":{"attempts":1,"streak":99,"review":false}}').run('Object.keys(progress).length'),0);
const blocked=boot('{}',true);
blocked.run("record('farao',false)");
assert.equal(blocked.node('#review-count').textContent,1);
assert.match(blocked.node('.local-note').textContent,/bara under detta besök/);
console.log('OK: 36 begrepp, urval, progression, repetition, matchningsfel, återläsning och blockerat sparande.');
