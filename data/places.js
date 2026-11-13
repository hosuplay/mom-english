// A course links to an existing card when the English already appears in the catalog.
const placeEntries = new Map();
for (const entry of window.MOM_CATALOG) {
 const key = readingNormalize(entry.english);
 if (!placeEntries.has(key)) placeEntries.set(key, entry.id);
}

function placeCard(id, english, korean) {
 const key = readingNormalize(english);
 if (placeEntries.has(key)) return placeEntries.get(key);
 window.MOM_CATALOG.push({id, english, korean, type:'place'});
 placeEntries.set(key, id);
 return id;
}

const poolOpening = placeCard('pool-beginner-lane','Is this lane for beginners?','이 레인은 초보자용인가요?');
const tableTennisOpening = placeCard('ping-pong-invite','Would you like to play a game?','한 게임 하실래요?');
const marketOpening = placeCard('market-price','How much is this?','이거 얼마예요?');
const poolCapRule = placeCard('pool-cap-rule','Do I have to wear a swim cap?','수영모를 꼭 써야 하나요?');
const tableTennisTurn = placeCard('ping-pong-turn',"It's my turn to serve.",'제가 서브할 차례예요.');
const marketApples = placeCard('market-apples',"I'd like to buy some apples.",'사과를 좀 사고 싶어요.');
const marketKiloPrice = placeCard('market-kilo-price',"What's the price per kilogram?",'1킬로그램에 얼마예요?');

window.MOM_PLACES = [
 {
  id:'pool', title:'수영장', description:'초보 레인과 수영장 시설 물어보기',
  words:[
   placeCard('pool-lane','swimming lane','수영 레인'),
   placeCard('pool-cap','swim cap','수영 모자'),
   placeCard('pool-shallow','shallow end','수영장의 물이 얕은 쪽')
  ],
  phrases:[
   poolOpening,
   poolCapRule
  ],
  grammar:[
   [poolOpening,'Is this …?로 가까이 있는 것을 가리키며 물어봐요. for beginners는 ‘초보자를 위한’이라는 뜻이에요.'],
   [poolCapRule,'Do I have to + 동사원형?으로 꼭 해야 하는지 물어봐요. wear는 ‘입다, 쓰다’라는 뜻이에요.']
  ],
  dialogue:[
   ['나',poolOpening],
   ['안내 직원',placeCard('pool-lane-reply','Yes, you can swim in this lane.','네, 이 레인에서 수영하시면 돼요.')],
   ['나',placeCard('pool-lockers','Where are the lockers?','사물함은 어디에 있나요?')],
   ['안내 직원',placeCard('pool-lockers-reply','They’re by the showers.','샤워실 옆에 있어요.')]
  ]
 },
 {
  id:'table-tennis', title:'탁구장', description:'같이 치자고 권하고 연습하기',
  words:[
   placeCard('ping-pong-paddle','table tennis paddle','탁구채'),
   placeCard('ping-pong-ball','ping-pong ball','탁구공'),
   placeCard('ping-pong-serve','first serve','첫 서브 (처음 넣는 공)')
  ],
  phrases:[
   tableTennisOpening,
   placeCard('ping-pong-table','Is this table free?','이 탁구대 비어 있나요?'),
   tableTennisTurn
  ],
  grammar:[
   [tableTennisOpening,'Would you like to + 동사원형?으로 같이 할 일을 공손하게 권해요.'],
   [tableTennisTurn,'It’s my turn to + 동사원형은 ‘내가 ~할 차례예요’라는 뜻이에요.']
  ],
  dialogue:[
   ['나',tableTennisOpening],
   ['상대',placeCard('ping-pong-warmup','Sure. Can we warm up first?','좋아요. 먼저 몸 좀 풀까요?')],
   ['나',placeCard('ping-pong-easy','Let’s start slowly.','천천히 시작해요.')],
   ['상대',placeCard('ping-pong-first','Would you like to serve first?','먼저 서브하실래요?')]
  ]
 },
 {
  id:'market', title:'시장', description:'가격과 결제 방법 물어보기',
  words:[
   placeCard('market-stall','market stall','시장 좌판'),
   placeCard('market-kilo','a kilo','1킬로그램'),
   placeCard('market-change','loose change','잔돈')
  ],
  phrases:[
   marketOpening,
   placeCard('market-card','Do you take cards?','카드 결제 되나요?'),
   marketKiloPrice, marketApples
  ],
  grammar:[
   [marketOpening,'How much is + 물건?으로 가격을 물어봐요. 물건을 가리키면서 this라고 말해도 돼요.'],
   [marketKiloPrice,'per는 ‘~당’이라는 뜻이에요. per kilogram은 ‘1킬로그램당’이에요.'],
   [marketApples,'I’d like to + 동사원형으로 하고 싶은 일을 공손하게 말해요.']
  ],
  dialogue:[
   ['나',marketOpening],
   ['상인',placeCard('market-price-reply','It’s five dollars a kilo.','1킬로에 5달러예요.')],
   ['나',placeCard('market-order','I’ll take half a kilo, please.','반 킬로만 주세요.')],
   ['상인',placeCard('market-bag','Would you like a bag?','봉투 드릴까요?')]
  ]
 }
];
