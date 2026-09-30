const $=s=>document.querySelector(s);
const icons={home:'<path d="m3 10 9-7 9 7v10H15v-7H9v7H3z"/>',menu:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h1m3 0h4M8 12h1m3 0h4M8 16h1m3 0h4"/>',star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[n]}</svg>`;
const coffeeIcon='assets/mom-coffee-icon.jpg?v=1';
const favicon=document.querySelector('link[rel="icon"]');if(favicon)favicon.href=coffeeIcon;
const catalog=window.MOM_CATALOG, wordCategories=window.MOM_WORD_CATEGORIES;
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(key,fallback){try{return JSON.parse(localStorage.getItem('mom-english:'+key))??fallback}catch{return fallback}}
function save(key,value){try{localStorage.setItem('mom-english:'+key,JSON.stringify(value))}catch{}}
let favorites=read('favorites',[]),recent=read('recent',[]),progress=read('progress',{}),prefs=read('settings',{size:'normal',theme:'beige'});
let session=null,timer=null;
try{session=JSON.parse(sessionStorage.getItem('mom-english:session'));if(session&&!session.ids.every(id=>catalog.some(e=>e.id===id)))session=null}catch{}
const persist=()=>{try{sessionStorage.setItem('mom-english:session',JSON.stringify(session))}catch{}};
const get=id=>catalog.find(e=>e.id===id);
const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const menus=[['today','오늘 10분 공부','새로운 내용을 알아서 10개 골라줘요'],['expressions','외래어·헷갈리는 영어','한국에서 쓰는 말과 실제 영어'],['words','단어 복습','익숙한 단어부터 10개씩'],['daily','생활영어 복습','짧은 표현을 다시 익혀요'],['patterns','패턴영어 복습','문장 틀에 말을 바꿔 넣어 연습해요'],['reading','영어 읽기 연습','표지판·브랜드·자동차·생활 단어를 읽어봐요'],['speaking','말하기 연습','듣고, 천천히 따라 말해요'],['mixed','종합 복습','배운 내용을 한데 모아 다시 봐요'],['saved','복습함','틀린 것·즐겨찾기·최근 공부']];
const names=Object.fromEntries(menus.map(([id,name])=>[id,name]));
const patternGroups=window.MOM_PATTERN_GROUPS||[];
const readingGroups=window.MOM_READING_GROUPS||[];
const arrow='<span class="chevron" aria-hidden="true"></span>';
const row=(href,title,desc='',i=null)=>`<a class="row" href="${href}">${i===null?'':`<span class="number">${String(i+1).padStart(2,'0')}</span>`}<span><span class="row-title">${escapeHTML(title)}</span>${desc?`<span class="row-desc">${escapeHTML(desc)}</span>`:''}</span>${arrow}</a>`;
const header=(title,back='#menu')=>`<div class="top"><a class="back" href="${back}" aria-label="뒤로">${arrow}</a></div><h1>${escapeHTML(title)}</h1>`;
const empty=(text,detail='학습 내용을 추가하면 이곳에서 복습할 수 있어요.')=>`<div class="empty"><h2>${escapeHTML(text)}</h2><p>${escapeHTML(detail)}</p><a class="secondary" href="#menu">골라서 공부하기</a></div>`;
function applyPrefs(){document.documentElement.style.fontSize=prefs.size==='large'?'21px':'18px';document.documentElement.style.setProperty('--paper',prefs.theme==='white'?'#ffffff':'#f7f5ef')}
applyPrefs();
function pool(scope){
 if(scope.startsWith('words:'))return catalog.filter(e=>e.type==='word'&&e.category===scope.split(':')[1]);
 if(scope.startsWith('expressions:'))return catalog.filter(e=>e.type==='expression'&&e.category===scope.split(':')[1]);
 if(scope==='daily'||scope==='speaking')return catalog.filter(e=>e.type==='phrase');
 if(scope.startsWith('patterns:'))return catalog.filter(e=>e.type==='pattern'&&e.category===scope.split(':')[1]);
 if(scope==='patterns')return catalog.filter(e=>e.type==='pattern');
 if(scope.startsWith('reading:'))return catalog.filter(e=>(e.readingCategories||[]).includes(scope.split(':')[1]));
 if(scope==='reading')return catalog.filter(e=>(e.readingCategories||[]).length);
 if(scope==='expressions')return catalog.filter(e=>e.type==='expression');
 if(scope==='favorites')return catalog.filter(e=>favorites.includes(e.id));
 if(scope==='wrong')return catalog.filter(e=>progress[e.id]?.wrong);
 if(scope==='mixed')return catalog.filter(e=>progress[e.id]?.seen&&!progress[e.id]?.wrong);
 if(scope==='recent')return recent.map(get).filter(e=>e&&!progress[e.id]?.wrong);
 if(scope==='today')return catalog.filter(e=>e.type!=='pattern'&&e.type!=='reading');
 return [];
}
const reviewScopes=new Set(['wrong','favorites','recent','mixed']);
function selectBatch(items,scope){
 const previous=new Set(session?.ids||[]);
 if(!reviewScopes.has(scope)){
  const unseen=shuffle(items.filter(e=>!progress[e.id]?.seen));
  return unseen.slice(0,10);
 }
 const ranked=shuffle(items).sort((a,b)=>{
  const x=progress[a.id]||{},y=progress[b.id]||{};
  return (x.lastSeen||0)-(y.lastSeen||0);
 });
 const fresh=ranked.filter(e=>!previous.has(e.id));
 const repeat=ranked.filter(e=>previous.has(e.id));
 return [...fresh,...repeat].slice(0,10);
}
function go(route){if(location.hash==='#'+route)render();else location.hash=route}
function begin(scope,ids){
 const items=ids?ids.map(get).filter(Boolean).slice(0,10):selectBatch(pool(scope),scope);
 session={scope,ids:items.map(e=>e.id),answers:[],index:0,mode:null,questions:[],feedback:null};
 const now=Date.now();items.forEach(e=>{progress[e.id]={...progress[e.id],seen:true,lastSeen:now};recent=[e.id,...recent.filter(id=>id!==e.id)].slice(0,30)});
 save('progress',progress);save('recent',recent);persist();go('study');
}
let voiceCache=[];
const isAndroid=/Android/i.test(navigator.userAgent||'');
function refreshVoices(){
 if(!('speechSynthesis'in window))return [];
 const voices=window.speechSynthesis.getVoices()||[];
 if(voices.length)voiceCache=voices;
 return voiceCache;
}
function preferredEnglishVoice(){
 const voices=refreshVoices();
 return voices.find(v=>v.name==='Samantha')
  ||voices.find(v=>/Google US English/i.test(v.name))
  ||voices.find(v=>/(Aria|Jenny|Ava|Allison|Sandy|Shelley|Flo)/i.test(v.name)&&/^en-US\b/i.test(v.lang))
  ||voices.find(v=>/^en-US\b/i.test(v.lang))
  ||voices.find(v=>/^en\b/i.test(v.lang));
}
if('speechSynthesis'in window){
 refreshVoices();
 window.speechSynthesis.addEventListener?.('voiceschanged',refreshVoices);
}
function makeEnglishUtterance(text,voice){
 const utterance=new SpeechSynthesisUtterance(text);
 utterance.lang='en-US';
 utterance.rate=.78;
 utterance.pitch=1;
 if(voice)utterance.voice=voice;
 return utterance;
}
async function speak(id){
 const e=get(id);if(!e)return;
 if(!('speechSynthesis'in window)){status('이 브라우저에서는 음성 재생을 지원하지 않아요.');return}
 let preferred=preferredEnglishVoice();

 // Apple 계열은 엉뚱한 기본 음성으로 떨어지지 않도록 영어 음성을 잠깐 기다립니다.
 // Android/Samsung은 getVoices()가 빈 배열이어도 실제 TTS는 동작하는 경우가 있어
 // 영어 언어 코드만 지정한 시스템 음성을 바로 허용합니다.
 if(!preferred&&!isAndroid){
  await new Promise(resolve=>{
   let done=false;
   const finish=()=>{if(done)return;done=true;window.speechSynthesis.removeEventListener?.('voiceschanged',finish);resolve()};
   window.speechSynthesis.addEventListener?.('voiceschanged',finish,{once:true});
   setTimeout(finish,700);
  });
  preferred=preferredEnglishVoice();
 }
 if(!preferred&&!isAndroid){
  status('영어 원어민 음성을 불러오는 중이에요. 잠시 후 다시 눌러주세요.');
  return;
 }

 const play=(voice,allowRetry)=>{
  const utterance=makeEnglishUtterance(e.english,voice);
  utterance.onerror=()=>{
   if(isAndroid&&allowRetry&&voice){
    // 일부 갤럭시는 명시한 voice 객체를 거부하므로 en-US 시스템 음성으로 한 번 재시도합니다.
    play(null,false);
   }else{
    status('음성을 재생하지 못했어요. 휴대폰의 미디어 음량도 확인해 주세요.');
   }
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume?.();
  window.speechSynthesis.speak(utterance);
 };
 play(preferred,true);
}

function status(message){const el=$('#speech-status');if(el)el.textContent=message}
function card(e){
 const readingMode=session?.scope?.startsWith('reading:');
 const source=readingMode?(e.readingSource||e.source):(e.source||'');
 const lessonTag=readingMode?(e.readingLessonTag||e.lessonTag):(e.lessonTag||'');
 return `<article class="study-card"><button class="star" data-favorite="${escapeHTML(e.id)}" aria-label="즐겨찾기 ${favorites.includes(e.id)?'해제':'추가'}" aria-pressed="${favorites.includes(e.id)}">${icon('star')}</button>${e.type==='pattern'&&e.pattern?`<p class="muted">패턴: ${escapeHTML(e.pattern)}</p>`:e.koreanUsage?`<p class="muted">한국에서: ${escapeHTML(e.koreanUsage)}</p>`:''}<button class="speak-word" data-speak="${escapeHTML(e.id)}" lang="en" aria-label="${escapeHTML(e.english)} 발음 듣기">${escapeHTML(e.english)}<span aria-hidden="true"> ♪</span></button><p class="translation">${escapeHTML(e.korean)}</p>${e.type==='pattern'&&e.tip?`<p class="muted">${escapeHTML(e.tip)}</p>`:e.difference?`<p class="muted">${escapeHTML(e.difference)}</p>`:''}${source||lessonTag?`<p class="small-note">${escapeHTML([source,lessonTag].filter(Boolean).join(' · '))}</p>`:''}</article>`;
}
function testStart(mode){
 if(!session?.ids.length)return;
 const answerKey=mode==='en-ko'?'korean':'english';
 session.mode=mode;session.index=0;session.answers=[];session.feedback=null;
 session.questions=shuffle(session.ids).map(id=>{
  const e=get(id),answer=e[answerKey];
  const scoped=session.scope?.startsWith('reading:')?pool(session.scope):catalog.filter(x=>x.type===e.type);
  const candidates=shuffle(scoped).concat(shuffle(catalog));
  const distractors=[...new Set(candidates.filter(x=>x[answerKey]!==answer&&x.english!==e.english&&x.korean!==e.korean).map(x=>x[answerKey]))].slice(0,3);
  return {id,answer,options:shuffle([answer,...distractors])};
 });persist();go('test');
}
function advance(){
 clearTimeout(timer);timer=null;if(!session?.feedback)return;
 session.index++;session.feedback=null;persist();go(session.index>=session.questions.length?'result':'test');
}
function answer(index){
 if(!session||session.feedback||!session.questions[session.index])return;
 const q=session.questions[session.index],value=q.options[index];if(value===undefined)return;
 const correct=value===q.answer;session.answers.push({id:q.id,correct});
 const old=progress[q.id]||{};progress[q.id]={...old,seen:true,lastSeen:Date.now(),lastTest:Date.now(),wrong:!correct,misses:(old.misses||0)+(correct?0:1)};
 session.feedback={index,correct};save('progress',progress);persist();render();
}
function render(){
 clearTimeout(timer);timer=null;
 const [page='home',sub,arg]=(location.hash.slice(1)||'home').split('/');let html='';
 $('#nav').innerHTML=[['home','홈','home'],['menu','공부','menu'],['saved','복습','star'],['settings','설정','settings']].map(([id,label,ico])=>`<a href="#${id}" ${page===id?'aria-current="page"':''}>${icon(ico)}<span>${label}</span></a>`).join('');
 if(page==='home')html=`<section class="home"><img class="home-icon" src="${coffeeIcon}" alt="엄마영어 커피 아이콘"><h1>엄마영어</h1><p class="intro">매일, 조금씩<br>나를 위한 영어 시간</p><div class="home-choices"><a class="home-choice today-choice" href="#category/today"><span><strong>오늘 10분 공부</strong><small>새로운 내용 10개를 알아서 골라줘요</small></span>${arrow}</a><a class="home-choice" href="#menu"><span><strong>골라서 공부하기</strong><small>단어 · 생활영어 · 영어 읽기</small></span>${arrow}</a><a class="home-choice" href="#saved"><span><strong>복습함</strong><small>틀린 것 · 즐겨찾기 · 최근 공부</small></span>${arrow}</a></div></section>`;
 else if(page==='menu')html=header('골라서 공부하기','#home')+`<p class="muted">공부하고 싶은 종류만 고르면 돼요.</p><div class="list">${row('#choose/words','단어 · 표현','단어 / 외래어·콩글리시 / 헷갈리는 영어',0)}${row('#choose/life','생활영어','생활영어 / 패턴영어 / 말하기',1)}${row('#category/reading','영어 읽기','표지판 / 브랜드 / 자동차 / 기초단어',2)}</div>`;
 else if(page==='choose'){
  if(sub==='words')html=header('단어 · 표현','#menu')+`<div class="list">${row('#category/words','단어','기본 단어부터 친절한 대학 단어까지',0)}${row('#category/expressions','외래어 · 헷갈리는 영어','외래어 / 콩글리시 / 헷갈리는 표현',1)}</div>`;
  else if(sub==='life')html=header('생활영어','#menu')+`<div class="list">${row('#category/daily','생활영어','짧은 일상 표현',0)}${row('#category/patterns','패턴영어','문장 틀을 바꿔가며 연습',1)}${row('#category/speaking','말하기','듣고 천천히 따라 말하기',2)}</div>`;
  else{go('menu');return}
 }
 else if(page==='category'){
  const scope=sub==='quiz'?'mixed':sub;html=header(names[scope]||'최근 학습');
  if(scope==='words')html+=`<div class="list">${wordCategories.map(([id,name],i)=>row('#category/words:'+id,name,`${pool('words:'+id).length}개 · 한 번에 10개`,i)).join('')}</div>`;
  else if(scope==='expressions')html+=`<p class="muted">한국에서 쓰는 표현과 실제 영어의 차이를 배워요.</p><div class="list">${[['loanwords','생활 속 외래어'],['konglish','콩글리시와 실제 영어'],['confusing','헷갈리는 영어 표현']].map(([id,name],i)=>row('#category/expressions:'+id,name,`${pool('expressions:'+id).length}개`,i)).join('')}</div>`;
  else if(scope==='patterns')html+=`<p class="muted">문장 하나를 외우기보다 같은 틀에 말을 바꿔 넣어 연습해요.</p><div class="list">${patternGroups.map((g,i)=>row('#category/patterns:'+g.id,g.title,`${g.template} · ${pool('patterns:'+g.id).length}문장`,i)).join('')}</div>`;
  else if(scope==='reading')html+=`<p class="muted">길이나 가게에서 실제로 보이는 영어를 읽는 연습이에요.</p><div class="list">${readingGroups.map((g,i)=>row('#category/reading:'+g.id,g.title,`${g.desc} · ${pool('reading:'+g.id).length}개`,i)).join('')}</div>`;
  else{
   const items=pool(scope),wordCategory=wordCategories.find(([id])=>'words:'+id===scope);
   const available=reviewScopes.has(scope)?items:items.filter(e=>!progress[e.id]?.seen);
   if(wordCategory)html=header(wordCategory[1],'#category/words');
   if(scope.startsWith('expressions:'))html=header('외래어·헷갈리는 영어','#category/expressions');
   if(scope.startsWith('patterns:')){
    const g=patternGroups.find(x=>'patterns:'+x.id===scope);
    html=header(g?.title||'패턴영어 복습','#category/patterns')+`<p class="muted">${escapeHTML(g?.template||'')}<br>${escapeHTML(g?.meaning||'')}</p>`;
   }
   if(scope.startsWith('reading:')){
    const g=readingGroups.find(x=>'reading:'+x.id===scope);
    html=header(g?.title||'영어 읽기 연습','#category/reading')+`<p class="muted">${escapeHTML(g?.desc||'')}</p>`;
   }
   if(!available.length)html+=empty(scope==='mixed'?'먼저 학습한 내용을 모아 복습해요':scope==='wrong'?'틀린 항목이 없어요':reviewScopes.has(scope)?'복습할 항목이 없어요':'새로운 학습을 모두 했어요',scope==='mixed'?'단어나 생활영어를 학습하면 종합 복습에 모여요.':scope==='wrong'?'테스트에서 틀린 항목만 여기에 모여요.':reviewScopes.has(scope)?'다시 보고 싶은 내용을 저장하거나 학습하면 여기에 모여요.':'이 메뉴에서 본 내용은 자동으로 다시 나오지 않아요. 틀린 내용은 복습함의 ‘틀린 것 복습’에서만 다시 볼 수 있어요.');
   else html+=`<p class="muted">${available.length}개 중 ${Math.min(10,available.length)}개씩 ${scope==='speaking'?'듣고 따라 말해요.':'먼저 익힌 뒤 테스트해요.'}</p><button class="primary" data-begin="${escapeHTML(scope)}">학습하기</button><p class="small-note">${reviewScopes.has(scope)?'복습함에서는 저장되거나 이미 학습한 내용을 다시 볼 수 있어요.':'아직 안 본 내용만 나와요. 틀린 내용은 복습함의 ‘틀린 것 복습’에서만 다시 복습해요.'}</p>`;
  }
 }
 else if(page==='saved'||page==='favorites')html=header('복습함','#home')+`<p class="muted">다시 보고 싶은 것만 여기에서 찾아요.</p><div class="list">${row('#category/wrong','틀린 것 복습',`${pool('wrong').length}개`,0)}${row('#category/favorites','즐겨찾기',`${pool('favorites').length}개`,1)}${row('#category/recent','최근 공부',`${pool('recent').length}개`,2)}${row('#category/mixed','종합 복습',`${pool('mixed').length}개`,3)}</div><p class="small-note">진도와 오답은 이 기기에만 저장돼요.</p>`;
 else if(page==='study'&&session){
  const items=session.ids.map(get).filter(Boolean),speaking=session.scope==='speaking';
  html=header(speaking?'말하기 연습':'학습하기')+`<p class="muted">${items.length}개 · 영어를 누르면 발음을 들을 수 있어요.${speaking?'<br>듣고 천천히 따라 말해보세요.':''}</p><p id="speech-status" class="muted" role="status"></p><div class="list">${items.map(card).join('')}</div>`;
  if(items.length)html+=`<div class="study-actions"><button class="secondary" data-next-batch>${speaking?'다음 문장':'다음 10개'}</button>${speaking?'<a class="primary" href="#menu">연습 마치기</a>':'<a class="primary" href="#modes">테스트하기</a>'}</div>`;
  else html+=empty('복습할 항목이 없어요.');
 }
 else if(page==='modes'&&session?.ids.length)html=header('테스트 방식 선택','#study')+`<p class="muted">방금 학습한 ${session.ids.length}개를 확인해요.</p><div class="list"><button class="row" data-mode="en-ko"><span><span class="row-title">영어 → 한글</span><span class="row-desc">영어를 보고 한국어 뜻 고르기</span></span></button><button class="row" data-mode="ko-en"><span><span class="row-title">한글 → 영어</span><span class="row-desc">한국어 뜻을 보고 영어 고르기</span></span></button></div>`;
 else if(page==='test'&&session?.questions.length){
  if(session.index>=session.questions.length){go('result');return}
  const q=session.questions[session.index],e=get(q.id),feedback=session.feedback;
  html=`<div class="top"><a class="back" href="#study" aria-label="학습으로 돌아가기">${arrow}</a><span class="top-label">${session.mode==='en-ko'?'영어 → 한글':'한글 → 영어'}</span><span class="counter">${session.index+1} / ${session.questions.length}</span></div><div class="progress"><span style="width:${session.index/session.questions.length*100}%"></span></div><div class="question"><p class="instruction">알맞은 ${session.mode==='en-ko'?'뜻':'영어'}을 고르세요.</p><p class="english" ${session.mode==='en-ko'?'lang="en"':''}>${escapeHTML(session.mode==='en-ko'?e.english:e.korean)}</p></div><div class="options">${q.options.map((text,i)=>`<button class="option ${feedback?.index===i?'selected':''}" data-answer="${i}" ${feedback?'disabled':''}><span class="radio" aria-hidden="true"></span>${escapeHTML(text)}</button>`).join('')}</div>${feedback?`<div class="answer" role="status">${feedback.correct?'정답이에요!':'다시 익히면 괜찮아요.'}<small>정답: ${escapeHTML(q.answer)}</small></div>`:'<p class="muted center">고르면 자동으로 다음 문제로 넘어가요.</p>'}`;
  if(feedback)timer=setTimeout(()=>{if(location.hash==='#test')advance()},1400);
 }
 else if(page==='result'&&session?.questions.length){
  const wrong=session.answers.filter(a=>!a.correct).map(a=>get(a.id)),correct=session.answers.filter(a=>a.correct).length;
  html=header('복습 결과')+`<div class="result-score"><strong>${Math.round(correct/session.questions.length*100)}점</strong><p>${session.questions.length}문제 중 ${correct}개 정답</p></div><h2>틀린 ${wrong.some(e=>e.type!=='word')?'항목':'단어'} ${wrong.length}개</h2><div class="list">${wrong.map(card).join('')||'<p class="muted">모두 맞혔어요. 잘하셨어요!</p>'}</div><p id="speech-status" role="status" class="muted"></p><div class="study-actions">${wrong.length?'<button class="secondary" data-review-wrong>틀린 단어 다시 보기</button>':''}<button class="secondary" data-retry>다시 풀기</button><button class="primary" data-next-batch>다음 10개 학습</button></div>`;
 }
 else if(page==='settings')html=header('설정','#home')+`<div class="settings"><section class="setting"><h2>소리</h2><p class="muted">학습 화면의 영어를 누르면 기기의 영어 음성으로 읽어줘요.</p></section><fieldset class="setting"><legend>글자 크기</legend><div class="choices">${[['normal','기본'],['large','크게']].map(([v,t])=>`<label><input type="radio" name="size" value="${v}" ${prefs.size===v?'checked':''}>${t}</label>`).join('')}</div></fieldset><fieldset class="setting"><legend>테마 설정</legend><div class="choices">${[['beige','베이지'],['white','화이트']].map(([v,t])=>`<label><input type="radio" name="theme" value="${v}" ${prefs.theme===v?'checked':''}>${t}</label>`).join('')}</div></fieldset></div>`;
 else if(page==='learn'){const e=get(sub);if(e){begin(e.type==='word'?'words:'+e.category:'daily',[e.id]);return}else html=empty('학습 목록에서 다시 선택해주세요.')}
 else if(page==='topic'){go('category/'+(sub==='words'?'words:'+wordCategories[Number(arg)]?.[0]:sub==='quiz'?'mixed':sub));return}
 else if(page==='speaking'||page==='recent'){go('category/'+page);return}
 else html=header('학습을 시작해볼까요?','#home')+'<a class="primary" href="#menu">전체 목차 보기</a>';
 $('#main').innerHTML=html;document.title='엄마영어';
}
function handleAction(button){
 const d=button.dataset;
 if(d.begin!==undefined)begin(d.begin);
 else if(d.speak!==undefined)speak(d.speak);
 else if(d.favorite!==undefined){favorites=favorites.includes(d.favorite)?favorites.filter(id=>id!==d.favorite):[...favorites,d.favorite];save('favorites',favorites);button.setAttribute('aria-pressed',String(favorites.includes(d.favorite)));button.setAttribute('aria-label','즐겨찾기 '+(favorites.includes(d.favorite)?'해제':'추가'))}
 else if(d.mode!==undefined)testStart(d.mode);
 else if(d.answer!==undefined)answer(Number(d.answer));
 else if('nextBatch'in d)begin(session.scope);
 else if('retry'in d)testStart(session.mode);
 else if('reviewWrong'in d){const ids=session.answers.filter(a=>!a.correct).map(a=>a.id);begin('wrong',ids)}
}
document.addEventListener('click',event=>{const button=event.target.closest('button');if(button&&!button.disabled)handleAction(button)});
document.addEventListener('change',event=>{if(['size','theme'].includes(event.target.name)){prefs[event.target.name]=event.target.value;save('settings',prefs);applyPrefs()}});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);$('#main').focus({preventScroll:true})});
render();
