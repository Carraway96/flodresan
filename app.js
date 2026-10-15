'use strict';
const STORAGE_KEY='flodresan-progress-v1';
const $=selector=>document.querySelector(selector);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=items=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};
let storageAvailable=true;
let progress={};
try{
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
  if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
    for(const term of TERMS){
      const entry=saved[term.id];
      if(entry&&Number.isSafeInteger(entry.attempts)&&entry.attempts>=0&&Number.isSafeInteger(entry.streak)&&entry.streak>=0&&entry.streak<=entry.attempts&&typeof entry.review==='boolean'){
        progress[term.id]={attempts:entry.attempts,streak:entry.streak,review:entry.review};
      }
    }
  }
}catch{storageAvailable=false;}
let mode='cards';
let session=[];
let index=0;
let revealed=false;
let answered=false;
let score=0;
let misses=[];
let quizChoices=[];
let search='';
let round=[];
let definitions=[];
let matched=new Set();
let roundMistakes=new Set();
let selectedTerm=null;
let selectedDefinition=null;
let matchFeedback='';
let matchError=false;
const workspace=$('#workspace');

function announce(message){$('#announcement').textContent=message;}
function save(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));storageAvailable=true;}
  catch{storageAvailable=false;}
  updateProgress();
}
function record(id,correct){
  const previous=progress[id]||{attempts:0,streak:0,review:false};
  progress[id]={attempts:previous.attempts+1,streak:correct?previous.streak+1:0,review:!correct};
  save();
}
function updateProgress(){
  const entries=Object.values(progress);
  const secure=entries.filter(p=>p.streak>=2).length;
  const difficult=entries.filter(p=>p.review).length;
  $('#progress-count').textContent=`${secure} / ${TERMS.length}`;
  $('#knowledge-progress').value=secure;
  $('#knowledge-progress').textContent=`${secure} av ${TERMS.length}`;
  $('#practiced-count').textContent=entries.filter(p=>p.attempts>0).length;
  $('#review-count').textContent=difficult;
  $('#review-badge').textContent=difficult;
  $('#progress-note').textContent=secure===TERMS.length?'Alla begrepp känns trygga. Fortsätt repetera!':'Två rätt i följd gör ett begrepp tryggt.';
  $('.local-note').textContent=storageAvailable?'◉ Dina framsteg sparas på den här enheten':'◉ Framsteg sparas bara under detta besök';
  $('#storage-note').textContent=storageAvailable?'':'Webbläsaren tillåter inte sparande just nu. Du kan träna ändå, men framstegen kan försvinna när sidan stängs.';
}
function eligible(){
  return TERMS.filter(t=>($('#category').value==='all'||t.category===$('#category').value)&&(!$('#review-only').checked||progress[t.id]?.review));
}
function createSession(pool){
  // Weighted sampling without replacement: difficult terms are more likely early in a pass.
  return pool.map(t=>({term:t,key:-Math.log(Math.max(Number.MIN_VALUE,Math.random()))/(progress[t.id]?.review?4:1)}))
    .sort((a,b)=>a.key-b.key).map(x=>x.term).slice(0,Number($('#length').value));
}
function start(pool){
  session=createSession(pool||eligible());index=0;score=0;misses=[];revealed=false;answered=false;search='';
  if(mode==='match')newRound();
  if(mode==='quiz')prepareChoices();
  render();
}
function focus(selector){workspace.querySelector(selector)?.focus();}
function panelTop(label,current,total){return `<div class="exercise-top"><span class="pill">${escapeHTML(label)}</span><div><span>${current} av ${total}</span><progress value="${current}" max="${total}" aria-label="Framsteg i passet"></progress></div></div>`;}
function source(term){return `Läsmaterialet, s. ${escapeHTML(term.pages)}`;}
function render(){
  $('#length-label').hidden=mode==='library';
  if(mode==='library'){renderLibrary();return;}
  if(!session.length){
    workspace.innerHTML=`<div class="exercise result"><div class="result-icon" aria-hidden="true">✓</div><h3 tabindex="-1">${$('#review-only').checked?'Inga svåra begrepp här just nu':'Inga begrepp i urvalet'}</h3><p>Välj ett annat område eller träna på alla begrepp.</p><button class="primary" id="show-all">Visa alla begrepp</button></div>`;
    $('#show-all').onclick=()=>{$('#review-only').checked=false;$('#category').value='all';start();};return;
  }
  if(index>=session.length){renderResult();return;}
  if(mode==='cards')renderCard();
  if(mode==='quiz')renderQuiz();
  if(mode==='match')renderMatch();
}
function renderCard(){
  const t=session[index];
  workspace.innerHTML=`<div class="exercise">${panelTop(CATEGORIES[t.category],index+1,session.length)}<div class="card-content"><p class="card-prompt">Hur skulle du förklara begreppet?</p><h3 class="card-term" tabindex="-1">${escapeHTML(t.term)}</h3>${revealed?`<p class="card-answer">${escapeHTML(t.definition)}</p><p class="source-note">${source(t)}</p><p class="source-note">Exempel: ${escapeHTML(t.example)}</p><div class="actions"><button class="secondary" id="card-more">↻ Öva mer</button><button class="primary" id="card-know">✓ Det här kan jag</button></div>`:`<button class="primary" id="reveal" aria-expanded="false">Visa förklaring <span aria-hidden="true">↗</span></button><p class="card-bottom">Tänk först. Vänd sedan. Lär dig mer.</p>`}</div></div>`;
  if(!revealed){$('#reveal').onclick=()=>{revealed=true;renderCard();announce(t.definition);focus('#card-more');};}
  else{
    $('#card-more').onclick=()=>gradeCard(false);
    $('#card-know').onclick=()=>gradeCard(true);
  }
}
function gradeCard(correct){
  if(!revealed)return;
  const t=session[index];record(t.id,correct);
  if(correct)score++;else misses.push(t.id);
  index++;revealed=false;render();focus('h3');
  announce(correct?'Självbedömning sparad: det här kan jag.':'Begreppet är sparat för mer träning.');
}
function prepareChoices(){
  const t=session[index];if(!t)return;
  const same=TERMS.filter(x=>x.category===t.category&&x.id!==t.id);
  quizChoices=shuffle([t,...shuffle(same).slice(0,3)]);
}
function renderQuiz(){
  const t=session[index];
  workspace.innerHTML=`<div class="exercise">${panelTop('Quiz · '+CATEGORIES[t.category],index+1,session.length)}<h3 class="question" tabindex="-1">Vilken förklaring passar till <strong>${escapeHTML(t.term)}</strong>?</h3><div class="options">${quizChoices.map((option,i)=>`<button class="option" data-choice="${option.id}"><span class="option-letter" aria-hidden="true">${'ABCD'[i]}</span><span>${escapeHTML(option.definition)}</span></button>`).join('')}</div><div id="quiz-feedback"></div><div class="quiz-footer"><span>Ta din tid. Varje försök hjälper dig att lära.</span><button class="primary" id="next" hidden>${index===session.length-1?'Visa resultat':'Nästa begrepp →'}</button></div></div>`;
  workspace.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{
    if(answered)return;answered=true;
    const correct=button.dataset.choice===t.id;record(t.id,correct);
    if(correct)score++;else misses.push(t.id);
    workspace.querySelectorAll('[data-choice]').forEach(b=>{
      b.disabled=true;
      if(b.dataset.choice===t.id){b.classList.add('correct');b.setAttribute('aria-label','Rätt svar: '+b.innerText);}
    });
    if(!correct)button.classList.add('wrong');
    $('#quiz-feedback').innerHTML=`<div class="feedback ${correct?'':'error'}"><strong>${correct?'Rätt! Bra jobbat.':'Inte riktigt. Här är förklaringen:'}</strong>${correct?'':`<p>${escapeHTML(t.term)}: ${escapeHTML(t.definition)}</p>`}<p>${escapeHTML(t.example)}</p><span class="source-note">${source(t)}</span></div>`;
    $('#next').hidden=false;focus('#next');
    announce(correct?'Rätt! '+t.example:'Inte riktigt. '+t.term+': '+t.definition);
  });
  $('#next').onclick=()=>{if(!answered)return;index++;answered=false;prepareChoices();render();focus('h3');};
}
function newRound(){
  round=session.slice(index,index+4);definitions=shuffle(round);matched=new Set();roundMistakes=new Set();selectedTerm=null;selectedDefinition=null;matchFeedback='Välj ett begrepp och den förklaring som hör till.';matchError=false;
}
function renderMatch(){
  const complete=round.length===matched.size;
  workspace.innerHTML=`<div class="exercise">${panelTop('Para ihop',Math.min(index+matched.size,session.length),session.length)}<h3 class="question" tabindex="-1">Vilka hör ihop?</h3><div class="match-columns"><div class="match-column"><span>BEGREPP</span>${round.map(t=>`<button class="match-item ${matched.has(t.id)?'matched':''} ${selectedTerm===t.id?'selected':''}" data-term="${t.id}" aria-pressed="${selectedTerm===t.id}" ${matched.has(t.id)?'disabled':''}>${escapeHTML(t.term)}</button>`).join('')}</div><div class="match-column"><span>FÖRKLARING</span>${definitions.map(t=>`<button class="match-item ${matched.has(t.id)?'matched':''} ${selectedDefinition===t.id?'selected':''}" data-definition="${t.id}" aria-pressed="${selectedDefinition===t.id}" ${matched.has(t.id)?'disabled':''}>${escapeHTML(t.definition)}</button>`).join('')}</div></div><div class="feedback ${matchError?'error':''}">${escapeHTML(matchFeedback)}</div>${complete?`<div class="actions"><button class="primary" id="next-round">${index+round.length>=session.length?'Visa resultat':'Nästa omgång →'}</button></div>`:''}</div>`;
  workspace.querySelectorAll('[data-term]').forEach(b=>b.onclick=()=>{selectedTerm=b.dataset.term;choosePair('term',b.dataset.term);});
  workspace.querySelectorAll('[data-definition]').forEach(b=>b.onclick=()=>{selectedDefinition=b.dataset.definition;choosePair('definition',b.dataset.definition);});
  if(complete)$('#next-round').onclick=()=>{index+=round.length;newRound();render();focus('h3');};
}
function choosePair(side,id){
  let completedPair=false;
  if(selectedTerm&&selectedDefinition){
    completedPair=true;
    const t=TERMS.find(x=>x.id===selectedTerm);
    if(selectedTerm===selectedDefinition){
      matched.add(t.id);
      if(!roundMistakes.has(t.id)){record(t.id,true);score++;}
      matchFeedback=`Rätt! ${t.term}: ${t.definition}`;matchError=false;
    }else{
      if(!roundMistakes.has(t.id)){record(t.id,false);misses.push(t.id);roundMistakes.add(t.id);}
      matchFeedback='De hör inte ihop. Läs förklaringarna en gång till och försök igen.';matchError=true;
    }
    selectedTerm=null;selectedDefinition=null;
  }
  renderMatch();
  if(matched.size===round.length){focus('#next-round');announce('Alla par hittade. '+matchFeedback);}
  else{
    if(completedPair){const next=round.find(t=>!matched.has(t.id));focus(`[data-term="${next.id}"]`);}
    else focus(`[data-${side}="${id}"]`);
    if(completedPair)announce(matchFeedback);
  }
}
function renderResult(){
  const wrongTerms=TERMS.filter(t=>misses.includes(t.id));
  workspace.innerHTML=`<div class="exercise result"><div class="result-icon" aria-hidden="true">✦</div><p class="eyebrow" style="justify-content:center">ETT STEG LÄNGRE PÅ RESAN</p><h3 tabindex="-1">Bra jobbat, passet är klart!</h3><p>${mode==='cards'?`Du markerade ${score} av ${session.length} begrepp som bekanta.`:mode==='match'?`${score} av ${session.length} begrepp matchades utan felsvar.`:`Du fick ${score} av ${session.length} rätt.`}<br>${wrongTerms.length?'Här är begreppen att fortsätta öva på:':'Fortsätt repetera för att befästa kunskaperna.'}</p>${wrongTerms.length?`<div class="result-list">${wrongTerms.map(t=>`<span>${escapeHTML(t.term)}</span>`).join('')}</div>`:''}<div class="actions">${wrongTerms.length?'<button class="secondary" id="retry">Träna på passets svåra</button>':''}<button class="primary" id="restart">Starta ett nytt pass →</button></div></div>`;
  $('#restart').onclick=()=>{start();focus('h3');};
  if(wrongTerms.length)$('#retry').onclick=()=>{start(wrongTerms);focus('h3');};
}
function renderLibrary(){
  workspace.innerHTML=`<div class="exercise"><div class="library-search"><label for="search">Hitta ett begrepp</label><input id="search" type="search" placeholder="Sök begrepp eller förklaring…" autocomplete="off" value="${escapeHTML(search)}"></div><p class="source-note" id="search-count" role="status"></p><div class="glossary" id="glossary"></div></div>`;
  $('#search').oninput=event=>{search=event.target.value;renderDefinitions();};renderDefinitions();
}
function renderDefinitions(){
  const list=eligible().filter(t=>[t.term,t.definition,t.example].some(value=>value.toLocaleLowerCase('sv').includes(search.toLocaleLowerCase('sv'))));
  $('#search-count').textContent=`${list.length} begrepp i ditt urval`;
  $('#glossary').innerHTML=list.length?list.map(t=>{
    const state=progress[t.id];const status=state?.review?'↻ Öva mer':state?.streak>=2?'✓ Tryggt begrepp':state?.attempts?'◌ På väg':'Nytt begrepp';
    return `<article class="definition"><h3>${escapeHTML(t.term)}</h3><p>${escapeHTML(t.definition)}</p><p><em>Exempel:</em> ${escapeHTML(t.example)}</p><div class="definition-meta"><span class="source-note">s. ${escapeHTML(t.pages)} · ${CATEGORIES[t.category]}</span><span class="status">${status}</span></div></article>`;
  }).join(''):'<p>Inga begrepp matchar sökningen och filtren. Prova ett annat ord eller ändra urvalet.</p>';
}
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
  mode=button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  start();announce('Träningssätt: '+button.innerText.replace(/\n/g,' '));
});
$('#category').onchange=()=>start();$('#length').onchange=()=>start();$('#review-only').onchange=()=>start();
$('#help-button').onclick=()=>$('#help-dialog').showModal();
$('#close-help').onclick=()=>$('#help-dialog').close();$('#help-done').onclick=()=>$('#help-dialog').close();
$('#reset-button').onclick=()=>$('#reset-dialog').showModal();
$('#cancel-reset').onclick=()=>$('#reset-dialog').close();
$('#confirm-reset').onclick=()=>{progress={};save();$('#reset-dialog').close();start();announce('Dina framsteg har nollställts.');};
updateProgress();start();
