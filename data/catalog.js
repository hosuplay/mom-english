// Optional metadata is normalized here; the original 300 word records stay unchanged.
window.MOM_REFERENCES = {
 channels: [
  {name:'친절한 대학',url:'https://youtube.com/channel/UClPWDge6kFVESzlzcuXKJfw'},
  {name:'Bones English',url:'https://youtube.com/@bonesenglish'}
 ],
 videos:['https://youtu.be/C4sc7DKaKM4','https://youtu.be/ArzWZubqO3g']
};
window.MOM_WORD_CATEGORIES = [
 ['basic','기본 단어'],['food','음식'],['home','집과 생활'],
 ['travel','여행'],['health','건강'],['feelings','감정과 마음']
];
window.MOM_CATALOG = [
 ...window.MOM_WORD_CATEGORIES.flatMap(([category])=>window.MOM_WORDS[category].map(word=>({
  ...word,id:word.english==='coffee'?'coffee':'word-'+word.english,category,
  korean:word.korean||word.meaning,source:word.source||'',lessonTag:word.lessonTag||'',type:'word'
 }))),
 ...window.MOM_DAILY.map(item=>({...item,category:item.category||'feelings',
  english:item.english||item.full||item.text,korean:item.korean||item.meaning,
  source:item.source||'',lessonTag:item.lessonTag||'',type:'phrase'})),
 ...window.MOM_EXPRESSIONS.map(item=>({...item,source:item.source||'',lessonTag:item.lessonTag||'',type:'expression'}))
];
