(function(root){
  'use strict';
  // These are artistic life-form paths, not claims of direct ancestry.
  const paths={
    power:{name:'强壮巨兽',groups:[1,3,6,7],forest:[13,14,16,18,19],ends:[5,6,12,16]},
    agility:{name:'轻盈飞羽',groups:[1,2,5,8],forest:[4,9,12,15,16],ends:[3,7,13]},
    adaptation:{name:'逆境共生',groups:[4,10,4,10],forest:[1,8,10,11,14],ends:[4,9,14]},
    perception:{name:'深蓝探索',groups:[1,3,12,11],forest:[5,6,7,17,19],ends:[0,1,10,11,17]},
    intelligence:{name:'智慧新生',groups:[1,3,9,14],forest:[0,2,3,13,18],ends:[2,8,19]},
    fertility:{name:'繁盛花园',groups:[4,13,4,13],forest:[1,3,9,10,12],ends:[15,18]}
  };
  const nps='https://www.nps.gov/subjects/fossils/mass-extinctions-through-geologic-time.htm';
  const time='https://www.nps.gov/subjects/geology/time-scale.htm';
  const choice=(name,attrs,energy,evolution,label)=>({name,attrs,energy,evolution,duration:180,label});
  const history=[
    {name:'大氧化事件',mya:2400,date:'约24亿年前 · 古元古代',note:'大气中氧气显著增加，改变了早期生命的生存环境。',source:'https://astrobiology.nasa.gov/news/clues-to-oxygen-on-earth-before-the-great-oxidation-event/',options:[choice('发展耐氧代谢',{power:3,adaptation:-1},.3,-.1,'耐氧代谢'),choice('避入低氧庇护所',{adaptation:3,power:-1},-.15,.2,'低氧庇护')]},
    {name:'新元古代全球冰期',mya:635,date:'约7.2亿—6.35亿年前 · 成冰纪',note:'地球经历范围极广的冰川作用，冰封环境压缩了生命的栖息空间。',source:'https://astrobiology.nasa.gov/news/sustaining-aerobic-eukaryotes-on-snowball-earth/',options:[choice('强化储能和耐寒',{power:2,adaptation:2,agility:-1},.2,-.15,'耐寒储备'),choice('跟随温暖水流迁移',{perception:3,agility:1},-.2,.25,'融水迁徙')]},
    {name:'寒武纪生命大辐射',mya:539,date:'约5.39亿年前起 · 寒武纪',note:'动物身体结构和生态方式迅速多样化，化石记录呈现丰富的新面貌。',source:time,options:[choice('发展感官与捕食',{perception:3,power:1},.3,-.1,'感官捕食'),choice('发展轻巧附肢',{agility:3,fertility:1},-.1,.3,'附肢创新')]},
    {name:'奥陶纪末大灭绝',mya:444,date:'约4.44亿年前 · 奥陶纪末',note:'大规模冰川作用与海平面变化重创海洋生态。',source:nps,options:[choice('退往较深的海域',{perception:3,adaptation:1},.15,-.15,'深海避难'),choice('以繁衍维持种群',{fertility:3,power:-1},-.15,.25,'种群延续')]},
    {name:'陆地植被与早期森林扩张',mya:385,date:'约3.85亿年前 · 泥盆纪',note:'陆地植物逐渐形成森林，改变土壤、栖息地和地表环境。',source:time,options:[choice('建立根系与养分循环',{fertility:3,adaptation:1},.3,-.1,'根系繁盛'),choice('探索林下共生',{intelligence:3,adaptation:1},.15,.15,'林下共生')]},
    {name:'泥盆纪晚期生物危机',mya:372,date:'约3.72亿—3.59亿年前 · 晚泥盆世',note:'持续多次的生物危机使海洋群落与礁生态受到严重冲击。',source:nps,options:[choice('适应变化的水域',{adaptation:3,perception:1},.1,-.15,'水域适应'),choice('探索水岸新生态',{agility:2,power:2},-.2,.3,'水岸先驱')]},
    {name:'石炭纪煤沼森林',mya:310,date:'约3.1亿年前 · 石炭纪',note:'广阔的湿地森林留下大量植物遗存，后来形成重要煤层。',source:time,options:[choice('投入植物繁盛',{fertility:3,adaptation:1},.35,-.1,'煤沼绿潮'),choice('发展活动与感知',{agility:2,perception:2},-.1,.25,'林间探索')]},
    {name:'二叠纪末大灭绝',mya:252,date:'约2.52亿年前 · 二叠纪末',note:'地球历史上最严重的生物大灭绝，与大规模火山活动和环境剧变有关。',source:nps,options:[choice('收缩生态位，顽强适应',{adaptation:4,power:-1},-.25,.15,'灾变庇护'),choice('强化身体，争取资源',{power:4,fertility:-1},.25,-.2,'逆境竞争')]},
    {name:'三叠纪末大灭绝',mya:201,date:'约2.01亿年前 · 三叠纪末',note:'盘古大陆裂解期间的大规模火山活动伴随环境变化，许多生物类群消失。',source:nps,options:[choice('转向轻盈与迁移',{agility:4,power:-1},-.15,.3,'跨域迁移'),choice('加强协作与学习',{intelligence:4,agility:-1},.2,-.1,'协作求生')]},
    {name:'白垩纪—古近纪大灭绝',mya:66,date:'约6600万年前 · 白垩纪末',note:'希克苏鲁伯小行星撞击造成全球环境剧变，非鸟类恐龙等众多类群灭绝。',source:nps,options:[choice('以小体型灵活求生',{agility:3,intelligence:2,power:-2},-.2,.3,'小型求生'),choice('储备能量并守护群体',{power:2,fertility:3,perception:-1},.25,-.15,'群体庇护')]},
    {name:'古近纪哺乳动物辐射',mya:56,date:'约6600万—5600万年前 · 古近纪早期',note:'白垩纪末灭绝后，哺乳动物逐渐占据更多生态位，形态与生活方式日益多样。',source:'https://www.nps.gov/articles/000/paleogene-period.htm',options:[choice('发展学习与复杂行为',{intelligence:4,perception:1},.2,.1,'学习新生'),choice('扩大种群与共生网络',{fertility:4,adaptation:1},.3,-.1,'生态繁盛')]}
  ].map(e=>({...e,historical:true,options:e.options.map(o=>({...o,note:Object.entries(o.attrs).map(([key,v])=>({power:'体魄',agility:'灵巧',adaptation:'适应',perception:'感知',intelligence:'智慧',fertility:'繁衍'}[key])+' '+(v>0?'+':'')+v).join(' · ')+` · 产能 ${o.energy>0?'+':''}${Math.round(o.energy*100)}% · 演化 ${o.evolution>0?'+':''}${Math.round(o.evolution*100)}% / 180秒`}))}));
  const api={paths,history};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LifeJourney=api;
})(typeof window==='undefined'?globalThis:window);

