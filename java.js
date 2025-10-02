
let currentLanguage = localStorage.getItem('lexi_language') || 'uz';

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('lexi_language', lang);
    updateLanguage();
}

function updateLanguage() {
    
    document.querySelectorAll('[data-uz], [data-en]').forEach(element => {
        if (element.hasAttribute(`data-${currentLanguage}`)) {
            const text = element.getAttribute(`data-${currentLanguage}`);
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                
            } else if (element.tagName === 'OPTION') {
                element.textContent = text;
            } else {
                element.textContent = text;
            }
        }
    });

    document.querySelectorAll('[data-uz-placeholder], [data-en-placeholder]').forEach(element => {
        if (element.hasAttribute(`data-${currentLanguage}-placeholder`)) {
            element.placeholder = element.getAttribute(`data-${currentLanguage}-placeholder`);
        }
    });

    
    document.querySelectorAll('[data-uz-title], [data-en-title]').forEach(element => {
        if (element.hasAttribute(`data-${currentLanguage}-title`)) {
            element.title = element.getAttribute(`data-${currentLanguage}-title`);
        }
    });

    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });

    
    document.documentElement.lang = currentLanguage;
    
    
    updateFlashSourceLabel();
    
    
    renderWordList();
}

function updateFlashSourceLabel() {
    const flashSourceLabel = document.getElementById('flashSourceLabel');
    if (flashSourceLabel) {
        if (state.flashWords && state.flashWords.length) {
            flashSourceLabel.textContent = currentLanguage === 'uz' ? 
                `Manba: Import (${state.flashWords.length})` : 
                `Source: Imported (${state.flashWords.length})`;
        } else {
            flashSourceLabel.textContent = currentLanguage === 'uz' ? 
                `Manba: Lug'at (${state.words.length})` : 
                `Source: Dictionary (${state.words.length})`;
        }
    }
}


document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
    });
});


function genId(){ return 'id_'+Math.random().toString(36).slice(2,9); }
const DEFAULT_WORDS = [
  {id: genId(), word:"salom", meaning:"hello"},
  {id: genId(), word:"kitob", meaning:"book"},
  {id: genId(), word:"til", meaning:"language"},
  {id: genId(), word:"dunyo", meaning:"world"},
  {id: genId(), word:"maktab", meaning:"school"},
  {id: genId(), word:"xalq", meaning:"people"}
];

function normalizeWord(item){
  return { id: item.id || genId(), word: String(item.word||'').trim(), meaning: String(item.meaning||item.mean||'').trim() };
}

function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem('lexi_state')||'{}');
    const words = Array.isArray(s.words) ? s.words.map(normalizeWord) : DEFAULT_WORDS.slice();
    const seen = new Set();
    words.forEach(w=>{ if(!w.id) w.id=genId(); while(seen.has(w.id)) w.id = genId(); seen.add(w.id); });
    const quizWords = Array.isArray(s.quizWords) ? s.quizWords.map(normalizeWord) : [];
    const flashWords = Array.isArray(s.flashWords) ? s.flashWords.map(normalizeWord) : [];
    return { words, quizWords, flashWords, leaderboard: s.leaderboard || [], lastAction: s.lastAction || '' };
  }catch(e){ return { words: DEFAULT_WORDS.slice(), quizWords: [], flashWords: [], leaderboard: [], lastAction: '' }; }
}
function saveState(){
  const s = { words: state.words, quizWords: state.quizWords, flashWords: state.flashWords, leaderboard: state.leaderboard, lastAction: state.lastAction };
  localStorage.setItem('lexi_state', JSON.stringify(s));
}
let state = loadState();


let selectedIds = new Set();
let lastRenderedIds = [];
let selectAllActive = false;


const $ = id => document.getElementById(id);
function now(){ return new Date().toLocaleString(); }
function addAction(text){ state.lastAction = text; saveState(); renderSide(); }


function updateClock(){ $('topClock').textContent = new Date().toLocaleTimeString(); }
setInterval(updateClock,1000); updateClock();


document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('section[id^="tab-"]').forEach(s=>s.style.display='none');
    $('tab-'+tab).style.display='block';
    if(tab==='flash') loadFlashcard();
    if(tab==='results') renderResults();
  });
});


function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function escapeHtml(s){ return String(s).replace(/[&<>":'`]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;', '`':'&#96;' }[c])); }

function getWordIndexById(id){ return state.words.findIndex(w=>w.id===id); }
function getWordById(id){ return state.words.find(w=>w.id===id); }


function renderWordList(){
  const q = ($('searchInput').value||'').trim().toLowerCase();
  const ul = $('wordList'); ul.innerHTML = '';
  const list = state.words;
  const filtered = list.filter(w => {
    if(!q) return true;
    return w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q);
  });
  lastRenderedIds = filtered.map(w=>w.id);
  filtered.forEach(item=>{
    const li = document.createElement('li'); li.className='word-row';
    const checked = selectedIds.has(item.id) ? 'checked' : '';
    li.innerHTML = `
      <div class="word-left">
        <input class="check" type="checkbox" data-id="${item.id}" ${checked} />
        <div>
          <div class="w-word">${escapeHtml(item.word)}</div>
          <div class="w-meaning">${escapeHtml(item.meaning)}</div>
        </div>
      </div>
      <div class="row-actions">
        <button class="btn ghost tts-btn" title="${currentLanguage === 'uz' ? 'Talaffuz' : 'Pronunciation'}" data-id="${item.id}">🔊</button>
        <button class="btn ghost edit-btn" title="${currentLanguage === 'uz' ? 'O\'zgartirish' : 'Edit'}" data-id="${item.id}">✏️</button>
        <button class="btn danger del-btn" title="${currentLanguage === 'uz' ? 'O\'chirish' : 'Delete'}" data-id="${item.id}">🗑</button>
      </div>
    `;
    ul.appendChild(li);
  });

  ul.querySelectorAll('.check').forEach(cb=>{
    cb.addEventListener('change', e=>{
      const id = e.target.dataset.id;
      if(e.target.checked) selectedIds.add(id); else selectedIds.delete(id);
      if(!e.target.checked) selectAllActive = false;
      renderSide();
    });
  });
  ul.querySelectorAll('.tts-btn').forEach(b=> b.addEventListener('click', e=>{ 
    const w = getWordById(b.dataset.id); 
    if(w) tts(w.word); 
  }));
  ul.querySelectorAll('.edit-btn').forEach(b=> b.addEventListener('click', e=> editWord(b.dataset.id)));
  ul.querySelectorAll('.del-btn').forEach(b=> b.addEventListener('click', e=> deleteWord(b.dataset.id)));

  $('wordCount').textContent = state.words.length;
  $('sideWordCount').textContent = state.words.length;
  $('selectAllBtn').textContent = selectAllActive ? 
    (currentLanguage === 'uz' ? 'Hammasini bekor qilish' : 'Deselect All') : 
    (currentLanguage === 'uz' ? 'Barchasini tanlash' : 'Select All');
}


$('searchInput').addEventListener('input', ()=> {
  selectAllActive = false;
  renderWordList();
});


$('addWordBtn').addEventListener('click', ()=>{
  const w = ($('newWord').value||'').trim();
  const m = ($('newMean').value||'').trim();
  if(!w || !m){ alert(currentLanguage === 'uz' ? "So'z va ma'noni to'ldiring" : "Please fill both word and meaning"); return; }
  if(state.words.some(x=>x.word.toLowerCase()===w.toLowerCase())){ alert(currentLanguage === 'uz' ? "Bu so'z allaqachon mavjud" : "This word already exists"); return; }
  state.words.push({id: genId(), word:w, meaning:m});
  $('newWord').value=''; $('newMean').value='';
  addAction(currentLanguage === 'uz' ? `So'z qo'shildi: ${w}` : `Word added: ${w}`);
  saveState(); renderWordList();
});


function deleteWord(id){
  const idx = getWordIndexById(id);
  if(idx===-1) return;
  if(!confirm(currentLanguage === 'uz' ? `"${state.words[idx].word}" o'chirilsinmi?` : `Delete "${state.words[idx].word}"?`)) return;
  const removed = state.words.splice(idx,1);
  selectedIds.delete(id);
  addAction(currentLanguage === 'uz' ? `So'z o'chirildi: ${removed[0].word}` : `Word deleted: ${removed[0].word}`);
  saveState(); renderWordList();
}


function editWord(id){
  const idx = getWordIndexById(id);
  if(idx===-1) return;
  const cur = state.words[idx];
  const nw = prompt(currentLanguage === 'uz' ? "So'zni tahrirlash:" : "Edit word:", cur.word);
  if(nw===null) return;
  const nm = prompt(currentLanguage === 'uz' ? "Ma'nosini tahrirlash:" : "Edit meaning:", cur.meaning);
  if(nm===null) return;
  state.words[idx] = { id: cur.id, word: nw.trim() || cur.word, meaning: nm.trim() || cur.meaning };
  addAction(currentLanguage === 'uz' ? `So'z o'zgartirildi: ${state.words[idx].word}` : `Word edited: ${state.words[idx].word}`);
  saveState(); renderWordList();
}


function toggleSelectAll(){
  if(!lastRenderedIds || lastRenderedIds.length===0){ alert(currentLanguage === 'uz' ? "Hech qanday so'z ko'rinmadi" : "No words visible"); return; }
  if(!selectAllActive){
    lastRenderedIds.forEach(id=>selectedIds.add(id));
    selectAllActive = true;
  } else {
    lastRenderedIds.forEach(id=>selectedIds.delete(id));
    selectAllActive = false;
  }
  renderWordList();
}
$('selectAllBtn').addEventListener('click', toggleSelectAll);


$('deleteSelectedBtn').addEventListener('click', ()=>{
  const ids = Array.from(selectedIds);
  if(!ids.length){ alert(currentLanguage === 'uz' ? "Hech nima tanlanmadi" : "Nothing selected"); return; }
  if(!confirm(currentLanguage === 'uz' ? `${ids.length} ta so'zni o'chirasizmi?` : `Delete ${ids.length} words?`)) return;
  state.words = state.words.filter(w=>!selectedIds.has(w.id));
  selectedIds.clear(); selectAllActive = false;
  addAction(currentLanguage === 'uz' ? `Tanlangan ${ids.length} ta so'z o'chirildi` : `${ids.length} selected words deleted`);
  saveState(); renderWordList();
});


$('exportBtn').addEventListener('click', ()=>{
  const data = JSON.stringify({words:state.words.map(w=>({word:w.word,meaning:w.meaning}))},null,2);
  const blob = new Blob([data],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='lexiuz_export.json'; a.click();
  URL.revokeObjectURL(url);
});

$('importFile').addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=> {
    try{
      const j = JSON.parse(r.result);
      if(!Array.isArray(j.words)){ alert(currentLanguage === 'uz' ? 'JSON formati xato — "words" massiv bo\'lishi kerak' : 'Invalid JSON format — "words" must be an array'); e.target.value=''; return; }
      let added = 0;
      j.words.forEach(w=>{
        if(!w.word || !w.meaning) return;
        if(!state.words.some(x=>x.word.toLowerCase()===String(w.word).toLowerCase())){
          state.words.push({id: genId(), word:String(w.word).trim(), meaning:String(w.meaning).trim()}); added++;
        }
      });
      addAction(currentLanguage === 'uz' ? `Import: ${added} ta yangi so'z qo'shildi (lug'atga)` : `Import: ${added} new words added to dictionary`);
      saveState(); renderWordList();
      alert(currentLanguage === 'uz' ? `${added} ta yangi so'z import qilindi` : `${added} new words imported`);
    }catch(err){ alert(currentLanguage === 'uz' ? 'Import xatolik: '+err.message : 'Import error: '+err.message); }
    e.target.value = '';
  };
  r.readAsText(f);
});


function tts(text){
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'uz-UZ';
    u.rate = 0.95; u.pitch = 1;
    const vs = speechSynthesis.getVoices();
    const prefer = vs.find(v=>/uz|UZ/i.test(v.lang) || /uzb/i.test(v.name));
    if(prefer) u.voice = prefer;
    speechSynthesis.speak(u);
  }catch(e){ console.warn('TTS mavjud emas'); }
}


let flashIndex = 0;
const cardViewport = $('cardViewport');

$('flashImportBtn').addEventListener('click', ()=> $('flashImportFile').click());
$('flashImportFile').addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const parsed = JSON.parse(r.result);
      let arr = null;
      if(Array.isArray(parsed)) arr = parsed;
      else if(Array.isArray(parsed.words)) arr = parsed.words;
      if(!Array.isArray(arr)){ alert(currentLanguage === 'uz' ? "Flashcards JSON formati xato — 'words' yoki array kerak" : "Invalid flashcards JSON — 'words' or array required"); e.target.value=''; return; }
      const cleaned = [];
      arr.forEach(item=>{
        if(!item) return;
        const w = String(item.word || '').trim();
        const m = String(item.meaning || item.mean || item.meano || '').trim();
        if(w && m) cleaned.push({id: genId(), word:w, meaning:m});
      });
      if(cleaned.length===0){ alert(currentLanguage === 'uz' ? "JSON ichida yaroqli so'z topilmadi" : "No valid words found in JSON"); e.target.value=''; return; }
      state.flashWords = cleaned;
      saveState();
      addAction(currentLanguage === 'uz' ? `Flashcard uchun ${cleaned.length} ta so'z import qilindi (lug'atga qo'shilmadi)` : `Imported ${cleaned.length} words for flashcards (not added to dictionary)`);
      alert(currentLanguage === 'uz' ? `${cleaned.length} ta flashcard so'zlari yuklandi!` : `${cleaned.length} flashcard words loaded!`);
      loadFlashcard();
    }catch(err){ alert(currentLanguage === 'uz' ? "Xato: "+err.message : "Error: "+err.message); }
    e.target.value = '';
  };
  r.readAsText(f);
});

$('flashExportBtn').addEventListener('click', ()=>{
  const src = (state.flashWords && state.flashWords.length) ? state.flashWords : state.words;
  const data = JSON.stringify({words: src.map(w=>({word:w.word,meaning:w.meaning}))}, null, 2);
  const blob = new Blob([data],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='lexiuz_flash_export.json'; a.click(); URL.revokeObjectURL(url);
});


$('flashClearBtn').addEventListener('click', ()=> {
  if(!state.flashWords || state.flashWords.length===0){ alert(currentLanguage === 'uz' ? 'Import qilingan hech narsa yoʻq' : 'No imported data'); return; }
  if(!confirm(currentLanguage === 'uz' ? 'Import qilingan flash so‘zlarni tozalaysizmi? (Lugʻat saqlanadi)' : 'Clear imported flashcards? (Dictionary will be preserved)')) return;
  state.flashWords = [];
  saveState();
  addAction(currentLanguage === 'uz' ? 'Import qilingan flashcards tozalandi' : 'Imported flashcards cleared');
  loadFlashcard();
  alert(currentLanguage === 'uz' ? 'Import qilingan flashcards tozalandi' : 'Imported flashcards cleared');
});

function loadFlashcard(){
  const source = (state.flashWords && state.flashWords.length) ? state.flashWords : state.words;
  updateFlashSourceLabel();
  if(source.length===0){ 
    $('flashWord').textContent='—'; 
    $('flashMeaning').textContent='—'; 
    $('flashIdx').textContent='0/0'; 
    return; 
  }
  flashIndex = ((flashIndex % source.length)+source.length)%source.length;
  const w = source[flashIndex];
  $('flashWord').textContent = w.word;
  $('flashMeaning').textContent = w.meaning;
  $('flashIdx').textContent = `${flashIndex+1} / ${source.length}`;
  cardViewport.classList.remove('flipped');
}

$('flashcard').addEventListener('click', ()=>{ cardViewport.classList.toggle('flipped'); });
$('nextFlash').addEventListener('click', ()=>{ 
  const src = (state.flashWords && state.flashWords.length) ? state.flashWords : state.words; 
  if(src.length===0) return; 
  flashIndex=(flashIndex+1)%src.length; 
  loadFlashcard(); 
});
$('prevFlash').addEventListener('click', ()=>{ 
  const src = (state.flashWords && state.flashWords.length) ? state.flashWords : state.words; 
  if(src.length===0) return; 
  flashIndex=(flashIndex-1+src.length)%src.length; 
  loadFlashcard(); 
});
$('playFlash').addEventListener('click', ()=>{ 
  const src = (state.flashWords && state.flashWords.length) ? state.flashWords : state.words; 
  if(src[flashIndex]) tts(src[flashIndex].word); 
});


let quizState = { running:false, pool:[], currentItem:null, timerId:null, timeLeft:0, timePerQ:20, records:[], score:0, totalQuestions:0, source: [] };


$('quizImportBtn').addEventListener('click', ()=> $('quizImportFile').click());
$('quizImportFile').addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const parsed = JSON.parse(r.result);
      let arr = null;
      if(Array.isArray(parsed)) arr = parsed;
      else if(Array.isArray(parsed.words)) arr = parsed.words;
      if(!Array.isArray(arr)){ alert(currentLanguage === 'uz' ? "JSON formati xato — 'words' yoki array kerak" : "Invalid JSON format — 'words' or array required"); e.target.value=''; return; }
      const cleaned = [];
      arr.forEach(item=>{
        if(!item) return;
        const w = String(item.word || '').trim();
        const m = String(item.meaning || item.mean || item.meano || '').trim();
        if(w && m) cleaned.push({id: genId(), word:w, meaning:m});
      });
      if(cleaned.length===0){ alert(currentLanguage === 'uz' ? "JSON ichida yaroqli so'z topilmadi" : "No valid words found in JSON"); e.target.value=''; return; }
      state.quizWords = cleaned;
      saveState();
      addAction(currentLanguage === 'uz' ? `Quiz uchun ${cleaned.length} ta so'z import qilindi (lug'atga qo'shilmadi)` : `Imported ${cleaned.length} words for quiz (not added to dictionary)`);
      alert(currentLanguage === 'uz' ? `${cleaned.length} ta quiz so'zlar yuklandi!` : `${cleaned.length} quiz words loaded!`);
    }catch(err){ alert(currentLanguage === 'uz' ? "Xato: "+err.message : "Error: "+err.message); }
    e.target.value = '';
  };
  r.readAsText(f);
});


$('startQuizBtn').addEventListener('click', startQuiz);
$('stopQuizBtn').addEventListener('click', stopQuiz);

function resetQuizUI(){
  if(quizState.timerId){ clearInterval(quizState.timerId); quizState.timerId = null; }
  quizState.running = false;
  quizState.pool = [];
  quizState.currentItem = null;
  $('startQuizBtn').disabled = false;
  $('stopQuizBtn').disabled = true;
  $('quizTimer').textContent = '-- s';
  $('quizQuestion').textContent = currentLanguage === 'uz' ? 'Quiz hali boshlanmadi' : 'Quiz not started yet';
  $('quizOptions').innerHTML = '';
  $('quizProgress').textContent = `0 / 0`;
}

function finishQuiz(){
  if(quizState.timerId){ clearInterval(quizState.timerId); quizState.timerId = null; }
  quizState.running = false;
  $('startQuizBtn').disabled = false;
  $('stopQuizBtn').disabled = true;
  $('quizTimer').textContent = '-- s';
  showResults();
}


function startQuiz(){
  const source = (state.quizWords && state.quizWords.length) ? state.quizWords.slice() : state.words.slice();
  if(source.length===0){ alert(currentLanguage === 'uz' ? "Quiz uchun yetarli so'z yo'q (lug'at yoki quiz import qiling)" : "Not enough words for quiz (add to dictionary or import for quiz)"); return; }

  quizState.records = [];
  quizState.score = 0;
  quizState.running = true;
  quizState.timePerQ = Math.max(5, parseInt($('timePerQuestion').value)||20);

  if(state.quizWords && state.quizWords.length){
    quizState.totalQuestions = Math.min(source.length, parseInt($('quizCount').value) || source.length);
  } else {
    const requested = Math.max(1, parseInt($('quizCount').value) || 5);
    quizState.totalQuestions = Math.min(requested, source.length);
  }

  quizState.pool = shuffle(source).slice(0, quizState.totalQuestions);
  quizState.source = source;
  quizState.currentItem = null;

  $('quizScore').textContent = quizState.score;
  $('quizProgress').textContent = `0 / ${quizState.totalQuestions}`;
  $('startQuizBtn').disabled = true;
  $('stopQuizBtn').disabled = false;

  nextQuiz();
}

function stopQuiz(){
  if(!quizState.running) return;
  quizState.running = false;
  if(quizState.timerId) clearInterval(quizState.timerId);
  quizState.timerId = null;
  $('startQuizBtn').disabled = false;
  $('stopQuizBtn').disabled = true;
  finishQuiz();
}


function nextQuiz(){
  if(!quizState.running) return;
  if(quizState.pool.length===0){
    finishQuiz();
    return;
  }
  const item = quizState.pool.shift();
  quizState.currentItem = item;
  quizState.timeLeft = quizState.timePerQ;
  renderQuizQuestion(item);
  $('quizTimer').textContent = `${quizState.timeLeft}s`;
  if(quizState.timerId) clearInterval(quizState.timerId);
  quizState.timerId = setInterval(()=>{
    quizState.timeLeft--;
    $('quizTimer').textContent = `${quizState.timeLeft}s`;
    if(quizState.timeLeft<=0){
      clearInterval(quizState.timerId);
      quizState.timerId = null;
      recordAnswer(null, quizState.timePerQ);
      setTimeout(()=>{ if(quizState.running) nextQuiz(); }, 700);
    }
  },1000);
}

function renderQuizQuestion(item){
  const mode = $('quizMode').value;
  const w = item;
  const qText = mode==='wordToMeaning' ? 
    (currentLanguage === 'uz' ? `"${w.word}" so'zining ma'nosi nima?` : `What is the meaning of "${w.word}"?`) :
    (currentLanguage === 'uz' ? `Qaysi so'z bu ma'noga mos: "${w.meaning}"?` : `Which word matches this meaning: "${w.meaning}"?`);
  $('quizQuestion').textContent = qText;
  const others = quizState.source.filter(x=> !(x.word === w.word && x.meaning === w.meaning));
  shuffle(others);
  const opts = [w, ...others.slice(0,3)];
  shuffle(opts);
  const optsEl = $('quizOptions'); optsEl.innerHTML = '';
  opts.forEach(opt=>{
    const btn = document.createElement('button'); btn.className='opt-btn';
    btn.textContent = mode==='wordToMeaning' ? opt.meaning : opt.word;
    btn.onclick = ()=>{
      if(!quizState.running) return;
      if(quizState.timerId) clearInterval(quizState.timerId);
      quizState.timerId = null;
      const timeUsed = quizState.timePerQ - quizState.timeLeft;
      recordAnswer(opt, Math.max(1, timeUsed));
      setTimeout(()=>{ if(quizState.running) nextQuiz(); },700);
    };
    optsEl.appendChild(btn);
  });
}

function recordAnswer(chosenOpt, timeTaken){
  const mode = $('quizMode').value;
  const current = quizState.currentItem;
  const rec = {
    word: current.word,
    correctMeaning: current.meaning,
    chosen: chosenOpt ? (mode==='wordToMeaning' ? chosenOpt.meaning : chosenOpt.word) : null,
    correct: chosenOpt ? ((mode==='wordToMeaning'?chosenOpt.meaning:chosenOpt.word) === (mode==='wordToMeaning'?current.meaning:current.word)) : false,
    timeTaken
  };
  quizState.records.push(rec);
  if(rec.correct) quizState.score += 10; else quizState.score = Math.max(0, quizState.score - 2);
  $('quizScore').textContent = quizState.score;
  $('quizProgress').textContent = `${quizState.records.length} / ${quizState.totalQuestions}`;
  highlightOptions(rec);
  addAction(currentLanguage === 'uz' ? `Quiz javob: ${rec.word} — ${rec.correct ? 'Toʻgʻri' : 'Notoʻgʻri'}` : `Quiz answer: ${rec.word} — ${rec.correct ? 'Correct' : 'Incorrect'}`);
  saveState();
}

function highlightOptions(rec){
  const btns = Array.from($('quizOptions').children);
  const mode = $('quizMode').value;
  btns.forEach(b=>{
    const v = b.textContent;
    const isCorrect = (mode==='wordToMeaning' ? v===rec.correctMeaning : v===rec.word);
    if(isCorrect) b.classList.add('correct');
    if(rec.chosen && v===rec.chosen && !rec.correct) b.classList.add('wrong');
    b.disabled = true;
  });
}

function showResults(){
  const ra = $('resultsArea'); ra.innerHTML = '';
  const total = quizState.records.length;
  const correctCount = quizState.records.filter(r=>r.correct).length;
  const avgTime = total ? (quizState.records.reduce((s,r)=>s+r.timeTaken,0)/total).toFixed(1) : 0;
  const summary = document.createElement('div'); summary.className='result-row';
  summary.innerHTML = `<div><strong>${currentLanguage === 'uz' ? 'Ball:' : 'Score:'}</strong> ${quizState.score}</div><div class="small">${currentLanguage === 'uz' ? 'To\'g\'ri:' : 'Correct:'} ${correctCount}/${total}</div><div class="small">${currentLanguage === 'uz' ? 'O\'rtacha vaqt:' : 'Average time:'} ${avgTime}s</div>`;
  ra.appendChild(summary);
  quizState.records.forEach((r,i)=>{
    const row = document.createElement('div'); row.className='result-row';
    row.innerHTML = `<div style="max-width:65%"><strong>#${i+1} ${escapeHtml(r.word)}</strong><div class="small">${r.correct ? (currentLanguage === 'uz' ? 'Toʻgʻri' : 'Correct') : (currentLanguage === 'uz' ? 'Notoʻgʻri' : 'Incorrect')} • ${currentLanguage === 'uz' ? 'Javob:' : 'Answer:'} ${r.chosen ? escapeHtml(r.chosen) : (currentLanguage === 'uz' ? '<vaqt tugadi>' : '<time out>')}</div></div>
      <div style="text-align:right"><div><strong>${r.correct?'+10':'-2'}</strong></div><div class="small">${currentLanguage === 'uz' ? 'Vaqt:' : 'Time:'} ${r.timeTaken}s</div></div>`;
    ra.appendChild(row);
  });
  activateTab('results');
}


$('saveResultBtn').addEventListener('click', ()=>{
  const name = (($('playerName').value)||(currentLanguage === 'uz' ? 'Anonim' : 'Anonymous')).trim();
  if(!quizState.records.length){ alert(currentLanguage === 'uz' ? 'Quiz natijasi yoʻq' : 'No quiz results'); return; }
  state.leaderboard.push({name, score:quizState.score, date:new Date().toISOString()});
  state.leaderboard.sort((a,b)=>b.score - a.score);
  state.leaderboard = state.leaderboard.slice(0,10);
  addAction(currentLanguage === 'uz' ? `Natija saqlandi: ${name} — ${quizState.score}` : `Result saved: ${name} — ${quizState.score}`);
  saveState(); renderLeaderboard(); alert(currentLanguage === 'uz' ? 'Natija saqlandi!' : 'Result saved!');
});


$('clearResultsBtn').addEventListener('click', ()=>{ 
  $('resultsArea').innerHTML = `<div style="color:var(--muted)">${currentLanguage === 'uz' ? 'Natija tozalandi' : 'Results cleared'}</div>`; 
  quizState.records = []; 
  quizState.score=0; 
  saveState(); 
});


function renderLeaderboard(){
  const lb = $('leaderboard');
  lb.innerHTML = '';

  if(!state.leaderboard || state.leaderboard.length === 0){
    const empty = document.createElement('div');
    empty.style.color = 'var(--muted)';
    empty.textContent = currentLanguage === 'uz' ? "Hech kim yo'q" : "No one yet";
    lb.appendChild(empty);
    return;
  }

  state.leaderboard.forEach((r,i)=>{
    const d = document.createElement('div');
    d.className = 'lb-row';
    const left = document.createElement('div');
    left.innerHTML = `${i+1}. <strong>${escapeHtml(r.name)}</strong>`;
    const right = document.createElement('div');
    right.style.color = 'var(--muted)';
    right.textContent = `${r.score} • ${new Date(r.date).toLocaleString()}`;
    d.appendChild(left);
    d.appendChild(right);
    lb.appendChild(d);
  });
}

$('resetAllBtn').addEventListener('click', ()=>{
  if(!confirm(currentLanguage === 'uz' ? 'Natijalar tozalansinmi? (Lugʻat va import qilingan soʻzlar saqlanadi)' : 'Clear results? (Dictionary and imported words will be preserved)')) return;
  state.leaderboard = [];
  quizState.records = [];
  quizState.score = 0;
  saveState();
  addAction(currentLanguage === 'uz' ? 'Natijalar tozalandi' : 'Results cleared');
  renderLeaderboard();
  showResults();
});


function activateTab(name){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.tab-btn')).find(x=>x.dataset.tab===name);
  if(btn) btn.classList.add('active');
  document.querySelectorAll('section[id^="tab-"]').forEach(s=>s.style.display='none');
  $('tab-'+name).style.display='block';
}


function renderSide(){ $('lastAction').textContent = state.lastAction || '—'; }


function renderAll(){ 
  renderWordList(); 
  loadFlashcard(); 
  renderLeaderboard(); 
  renderSide(); 
}


document.addEventListener('DOMContentLoaded', function() {
    updateLanguage();
    renderAll();
});


window._lexi = {state, quizState};


$('stopQuizBtn').disabled = true;

function renderResults(){ showResults(); renderLeaderboard(); }

$('translateBtn').addEventListener('click', async () => {
    const inputText = $('inputText').value;
    const sourceLang = $('sourceLang').value;
    const targetLang = $('targetLang').value;
    const translatedTextarea = $('translatedText');
    const statusMessage = $('statusMessage');
    const translateBtn = $('translateBtn');

    if (inputText.trim() === '') {
        translatedTextarea.value = '';
        statusMessage.textContent = currentLanguage === 'uz' ? "Iltimos, tarjima qilish uchun matn kiriting." : "Please enter text to translate.";
        statusMessage.style.color = 'red';
        return;
    }

    statusMessage.textContent = currentLanguage === 'uz' ? "Tarjima qilinmoqda..." : "Translating...";
    statusMessage.style.color = '#555';
    translatedTextarea.value = '';
    translateBtn.disabled = true;

    try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(inputText)}`);
        
        if (!response.ok) {
            throw new Error(`Xato: ${response.status}`);
        }

        const data = await response.json();
        const translatedText = data[0].map(item => item[0]).join('');

        translatedTextarea.value = translatedText;
        statusMessage.textContent = currentLanguage === 'uz' ? "Tarjima muvaffaqiyatli bajarildi!" : "Translation completed successfully!";
        statusMessage.style.color = 'green';

    } catch (error) {
        console.error('Tarjima xatosi:', error);
        translatedTextarea.value = currentLanguage === 'uz' ? "Tarjima qilishda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring." : "Translation error occurred. Please try again later.";
        statusMessage.textContent = currentLanguage === 'uz' ? "Tarjima xatosi!" : "Translation error!";
        statusMessage.style.color = 'red';
    } finally {
        translateBtn.disabled = false;
    }
});
