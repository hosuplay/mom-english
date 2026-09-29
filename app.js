const $=s=>document.querySelector(s);
const icons={home:'<path d="m3 10 9-7 9 7v10H15v-7H9v7H3z"/>',menu:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h1m3 0h4M8 12h1m3 0h4M8 16h1m3 0h4"/>',star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[n]}</svg>`;
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
const menus=[['today','오늘의 복습','짧게 배우고, 가볍게 확인해요'],['expressions','외래어·헷갈리는 영어','한국에서 쓰는 말과 실제 영어'],['words','단어 복습','익숙한 단어부터 10개씩'],['daily','생활영어 복습','짧은 표현을 다시 익혀요'],['speaking','말하기 연습','듣고, 천천히 따라 말해요'],['mixed','종합 복습','배운 단어와 표현을 함께'],['saved','즐겨찾기 / 틀린 것 복습','다시 보고 싶은 내용을 모아서']];
const names=Object.fromEntries(menus.map(([id,name])=>[id,name]));
const arrow='<span class="chevron" aria-hidden="true"></span>';
const row=(href,title,desc='',i=null)=>`<a class="row" href="${href}">${i===null?'':`<span class="number">${String(i+1).padStart(2,'0')}</span>`}<span><span class="row-title">${escapeHTML(title)}</span>${desc?`<span class="row-desc">${escapeHTML(desc)}</span>`:''}</span>${arrow}</a>`;
const header=(title,back='#menu')=>`<div class="top"><a class="back" href="${back}" aria-label="뒤로">${arrow}</a></div><h1>${escapeHTML(title)}</h1>`;
const empty=(text,detail='학습 내용을 추가하면 이곳에서 복습할 수 있어요.')=>`<div class="empty"><h2>${escapeHTML(text)}</h2><p>${escapeHTML(detail)}</p><a class="secondary" href="#menu">전체 목차 보기</a></div>`;
function applyPrefs(){document.documentElement.style.fontSize=prefs.size==='large'?'21px':'18px';document.documentElement.style.setProperty('--paper',prefs.theme==='white'?'#ffffff':'#f7f5ef')}
applyPrefs();
function pool(scope){
 if(scope.startsWith('words:'))return catalog.filter(e=>e.type==='word'&&e.category===scope.split(':')[1]);
 if(scope.startsWith('expressions:'))return catalog.filter(e=>e.type==='expression'&&e.category===scope.split(':')[1]);
 if(scope==='daily'||scope==='speaking')return catalog.filter(e=>e.type==='phrase');
 if(scope==='expressions')return catalog.filter(e=>e.type==='expression');
 if(scope==='favorites')return catalog.filter(e=>favorites.includes(e.id));
 if(scope==='wrong')return catalog.filter(e=>progress[e.id]?.wrong);
 if(scope==='mixed')return catalog.filter(e=>progress[e.id]?.seen);
 if(scope==='recent')return recent.map(get).filter(Boolean);
 if(scope==='today')return catalog;
 return [];
}
function selectBatch(items){
 const ranked=shuffle(items).sort((a,b)=>{
  const x=progress[a.id]||{},y=progress[b.id]||{};
  if(!x.seen!==!y.seen)return x.seen?1:-1;
  if(!x.seen)return 0;
  if(!!x.wrong!==!!y.wrong)return x.wrong?-1:1;
  return (x.lastSeen||0)-(y.lastSeen||0);
 });
 // Prefer another batch when enough items exist, while keeping unseen items first.
 const previous=new Set(session?.ids||[]);
 const unseen=ranked.filter(e=>!progress[e.id]?.seen);
 const remainder=ranked.filter(e=>progress[e.id]?.seen);
 const fresh=remainder.filter(e=>!previous.has(e.id));
 const repeat=remainder.filter(e=>previous.has(e.id));
 return shuffle([...unseen,...fresh,...repeat].slice(0,10));
}
function go(route){if(location.hash==='#'+route)render();else location.hash=route}
function begin(scope,ids){
 const items=ids?ids.map(get).filter(Boolean).slice(0,10):selectBatch(pool(scope));
 session={scope,ids:items.map(e=>e.id),answers:[],index:0,mode:null,questions:[],feedback:null};
 const now=Date.now();items.forEach(e=>{progress[e.id]={...progress[e.id],seen:true,lastSeen:now};recent=[e.id,...recent.filter(id=>id!==e.id)].slice(0,30)});
 save('progress',progress);save('recent',recent);persist();go('study');
}
function speak(id){
 const e=get(id);if(!e)return;
 if(!('speechSynthesis'in window)){status('이 브라우저에서는 음성 재생을 지원하지 않아요.');return}
 const utterance=new SpeechSynthesisUtterance(e.english);
utterance.lang='en-US';
utterance.rate=.78;
utterance.pitch=1;
const voices=window.speechSynthesis.getVoices();
const preferred=
  voices.find(v=>v.name==='Samantha')
  ||voices.find(v=>/Google US English/i.test(v.name))
  ||voices.find(v=>/(Aria|Jenny|Ava|Allison|Sandy|Shelley|Flo)/i.test(v.name)&&/^en/i.test(v.lang));
if(preferred)utterance.voice=preferred;
utterance.onerror=()=>status('음성을 재생하지 못했어요. 다시 눌러주세요.');
 window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);
}
function status(message){const el=$('#speech-status');if(el)el.textContent=message}
function card(e){return `<article class="study-card"><button class="star" data-favorite="${escapeHTML(e.id)}" aria-label="즐겨찾기 ${favorites.includes(e.id)?'해제':'추가'}" aria-pressed="${favorites.includes(e.id)}">${icon('star')}</button>${e.koreanUsage?`<p class="muted">한국에서: ${escapeHTML(e.koreanUsage)}</p>`:''}<button class="speak-word" data-speak="${escapeHTML(e.id)}" lang="en" aria-label="${escapeHTML(e.english)} 발음 듣기">${escapeHTML(e.english)}<span aria-hidden="true"> ♪</span></button><p class="translation">${escapeHTML(e.korean)}</p>${e.difference?`<p class="muted">${escapeHTML(e.difference)}</p>`:''}${e.source||e.lessonTag?`<p class="small-note">${escapeHTML([e.source,e.lessonTag].filter(Boolean).join(' · '))}</p>`:''}</article>`}
function testStart(mode){
 if(!session?.ids.length)return;
 const answerKey=mode==='en-ko'?'korean':'english';
 session.mode=mode;session.index=0;session.answers=[];session.feedback=null;
 session.questions=shuffle(session.ids).map(id=>{
  const e=get(id),answer=e[answerKey];
  const candidates=shuffle(catalog.filter(x=>x.type===e.type)).concat(shuffle(catalog));
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
 $('#nav').innerHTML=[['home','홈','home'],['menu','목차','menu'],['saved','복습함','star'],['settings','설정','settings']].map(([id,label,ico])=>`<a href="#${id}" ${page===id?'aria-current="page"':''}>${icon(ico)}<span>${label}</span></a>`).join('');
 if(page==='home')html=`<section class="home"><h1>엄마영어</h1><p class="intro">매일, 조금씩<br>나를 위한 영어 시간</p><a class="primary" href="#category/today">오늘의 복습 시작</a><div class="group">${row('#category/expressions','외래어·헷갈리는 영어','생활 속 표현, 실제 영어로')}${row('#menu','전체 목차')}${row('#saved','즐겨찾기 / 틀린 것 복습')}${row('#category/recent','최근 학습')}</div></section>`;
 else if(page==='menu')html=header('전체 목차','#home')+`<div class="list">${menus.map(([id,title,desc],i)=>row(id==='saved'?'#saved':'#category/'+id,title,desc,i)).join('')}</div>`;
 else if(page==='category'){
  const scope=sub==='quiz'?'mixed':sub;html=header(names[scope]||'최근 학습');
  if(scope==='words')html+=`<div class="list">${wordCategories.map(([id,name],i)=>row('#category/words:'+id,name,`${pool('words:'+id).length}개 · 한 번에 10개`,i)).join('')}</div>`;
  else if(scope==='expressions')html+=`<p class="muted">한국에서 쓰는 표현과 실제 영어의 차이를 배워요.</p><div class="list">${[['loanwords','생활 속 외래어'],['konglish','콩글리시와 실제 영어'],['confusing','헷갈리는 영어 표현']].map(([id,name],i)=>row('#category/expressions:'+id,name,`${pool('expressions:'+id).length}개`,i)).join('')}</div>`;
  else{
   const items=pool(scope),wordCategory=wordCategories.find(([id])=>'words:'+id===scope);
   if(wordCategory)html=header(wordCategory[1],'#category/words');
   if(scope.startsWith('expressions:'))html=header('외래어·헷갈리는 영어','#category/expressions');
   if(!items.length)html+=empty(scope==='mixed'?'먼저 학습한 내용을 모아 복습해요':scope==='wrong'?'틀린 항목이 없어요':'학습 내용을 준비하고 있어요',scope==='mixed'?'단어나 생활영어를 학습하면 종합 복습에 모여요.':'내용이 준비되면 학습 → 테스트 → 오답 복습으로 이어져요.');
   else html+=`<p class="muted">${items.length}개 중 ${Math.min(10,items.length)}개씩 ${scope==='speaking'?'듣고 따라 말해요.':'먼저 익힌 뒤 테스트해요.'}</p><button class="primary" data-begin="${escapeHTML(scope)}">학습하기</button><p class="small-note">${scope==='mixed'?'이미 학습한 단어와 표현을 함께 복습해요.':'아직 안 본 내용을 먼저, 그다음 틀린 것과 오래 안 본 내용을 복습해요.'}</p>`;
  }
 }
 else if(page==='saved'||page==='favorites')html=header('즐겨찾기 / 틀린 것 복습','#home')+`<div class="list">${row('#category/favorites','즐겨찾기',`${pool('favorites').length}개`,0)}${row('#category/wrong','틀린 것 복습',`${pool('wrong').length}개`,1)}</div><p class="small-note">진도와 오답은 이 기기에만 저장돼요.</p>`;
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
