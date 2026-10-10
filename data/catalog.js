// Optional metadata is normalized here; source notes stay internal while learners see Mom English topics.
window.MOM_REFERENCES = {
 channels: [
  {name:'친절한 대학',url:'https://youtube.com/channel/UClPWDge6kFVESzlzcuXKJfw'},
  {name:'Bones English',url:'https://youtube.com/@bonesenglish'}
 ],
 videos:['https://youtu.be/C4sc7DKaKM4','https://youtu.be/ArzWZubqO3g']
};

// Learner-facing word topics. Source/channel names are intentionally not used as categories.
window.MOM_WORD_CATEGORIES = [
 ['basic','기본 단어'],
 ['people','사람 · 가족'],
 ['home','집 · 생활'],
 ['food','음식 · 쇼핑'],
 ['travel','여행 · 이동'],
 ['health','건강 · 몸'],
 ['feelings','감정 · 마음'],
 ['work_school','학교 · 일'],
 ['time_nature','시간 · 자연']
];

const MOM_BASE_WORD_CATEGORY_IDS=['basic','food','home','travel','health','feelings'];
const topicText=word=>`${word.english||''} ${word.meaning||word.korean||''}`.toLowerCase();
const hasAny=(text,words)=>words.some(word=>new RegExp(`(^|[^a-z])${word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z]|$)`,'i').test(text));

function classifySourcedWord(word){
 const text=topicText(word);
 const ko=word.meaning||word.korean||'';

 if(hasAny(text,['meal','beverage','breakfast','lunch','dinner','restaurant','cafe','menu','food','drink','eat','cook','hungry','thirsty','coffee','tea','milk','bread','meat','fruit','vegetable','rice','sugar','salt','buy','shop','shopping','price','store','market'])||/(음식|식사|음료|먹|마시|맛|배고|목마|요리|과일|채소|빵|고기|쌀|가격|가게|시장|사다|팔다)/.test(ko))return 'food';

 if(hasAny(text,['illness','sick','healthy','health','hospital','doctor','nurse','medicine','pain','hurt','sleep','tired','exercise','body','birth','death','die','alive'])||/(건강|병|아프|통증|병원|의사|간호|약|다치|피곤|잠|수면|운동|몸|탄생|죽음|죽다|살아)/.test(ko))return 'health';

 if(hasAny(text,['pleasure','peace','dream','love','hate','happy','sad','angry','afraid','fear','worry','enjoy','fun','bored','excited','lonely','proud','shy','kind','honest','brave','calm','nervous','smile','laugh','cry','hope','wish','like','dislike'])||/(감정|기분|행복|슬프|화나|두렵|무섭|걱정|즐거|평화|사랑|미워|좋아|싫어|꿈|희망|자랑|부끄|외롭|놀라|흥분|편안|불안|친절|정직|용감|재미|심심|웃|울다)/.test(ko))return 'feelings';

 if(hasAny(text,['teacher','work','professional','library','school','question','answer','problem','solution','study','learn','teach','student','job','office','company','business','leader','meeting','test','exam','read','write','book'])||/(선생|교사|학생|학교|공부|배우|가르|책|도서관|일|직업|회사|사무|문제|해결|질문|대답|시험|회의|전문가|지도자|읽다|쓰다)/.test(ko))return 'work_school';

 if(hasAny(text,['vacation','travel','trip','road','street','station','airport','hotel','map','train','bus','taxi','plane','ticket','arrive','leave','walk','drive','ride','visit','east','west','north','south'])||/(여행|휴가|방학|길|거리|지도|공항|호텔|기차|버스|택시|비행|표|도착|출발|걷|운전|타다|방문|동쪽|서쪽|남쪽|북쪽)/.test(ko))return 'travel';

 if(hasAny(text,['summer','winter','spring','autumn','fall','future','past','morning','afternoon','evening','night','day','week','month','year','time','today','tomorrow','yesterday','earth','land','animal','tree','fire','weather','rain','snow','wind','sun','moon','sky','season'])||/(봄|여름|가을|겨울|계절|시간|과거|미래|오늘|내일|어제|아침|오후|저녁|밤|날|주|달|년|지구|땅|동물|나무|불|날씨|비|눈|바람|해|달|하늘)/.test(ko))return 'time_nature';

 if(hasAny(text,['inside','outside','front','back','room','house','home','clock','color','shape','clean','wash','open','close','sit','stand','bed','chair','table','kitchen','bathroom','clothes','wear'])||/(집|방|안쪽|바깥|앞쪽|뒤쪽|시계|색깔|모양|가구|청소|씻|열다|닫다|앉|서다|침대|의자|탁자|부엌|화장실|옷|입다|벗다)/.test(ko))return 'home';

 if(hasAny(text,['girl','boy','man','woman','male','female','friend','parent','child','human','wife','husband','son','daughter','sister','brother','host','guest','gentleman','lady','hero','family','mother','father','mom','dad','aunt','uncle','cousin','baby','person','people','neighbor'])||/(소녀|소년|남자|여자|남성|여성|친구|부모|아이|자녀|사람|인간|아내|남편|아들|딸|자매|형제|주인|주최자|손님|신사|숙녀|영웅|가족|엄마|아빠|어머니|아버지|이모|삼촌|사촌|아기|이웃)/.test(ko))return 'people';

 return 'basic';
}

const originalWords=MOM_BASE_WORD_CATEGORY_IDS.flatMap(category=>(window.MOM_WORDS[category]||[]).map(word=>({
 ...word,
 id:word.english==='coffee'?'coffee':'word-'+word.english,
 category,
 korean:word.korean||word.meaning,
 source:word.source||'',
 lessonTag:word.lessonTag||'',
 type:'word'
})));

const sourcedWords=['kind_nouns','kind_adjectives','kind_verbs'].flatMap(sourceCategory=>(window.MOM_WORDS[sourceCategory]||[]).map(word=>({
 ...word,
 id:word.english==='coffee'?'coffee':'word-'+word.english,
 category:classifySourcedWord(word),
 korean:word.korean||word.meaning,
 source:word.source||'',
 lessonTag:word.lessonTag||'',
 type:'word'
})));

window.MOM_CATALOG = [
 ...originalWords,
 ...sourcedWords,
 ...window.MOM_DAILY.map(item=>({...item,category:item.category||'feelings',
  english:item.english||item.full||item.text,korean:item.korean||item.meaning,
  source:item.source||'',lessonTag:item.lessonTag||'',type:'phrase'})),
 ...window.MOM_EXPRESSIONS.map(item=>({...item,source:item.source||'',lessonTag:item.lessonTag||'',type:'expression'})),
 ...(window.MOM_PATTERNS||[]).map(item=>({...item,source:item.source||'',lessonTag:item.lessonTag||'',type:'pattern'}))
];

const readingNormalize=value=>String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
(window.MOM_READING_ITEMS||[]).forEach(item=>{
 const existing=item.reuseExisting
  ? window.MOM_CATALOG.find(entry=>readingNormalize(entry.english)===readingNormalize(item.english))
  : null;
 if(existing){
  existing.readingCategories=[...new Set([...(existing.readingCategories||[]),...item.categories])];
  existing.readingSource=item.source||'';
  existing.readingLessonTag=item.lessonTag||'';
 }else{
  window.MOM_CATALOG.push({...item,readingCategories:item.categories,source:item.source||'',lessonTag:item.lessonTag||'',type:'reading'});
 }
});
