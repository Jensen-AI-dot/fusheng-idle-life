(function (root) {
  'use strict';
  const data = typeof module !== 'undefined' && module.exports ? require('./species-data.js') : root.LifeData;
  const { species, chapters } = data;
  const {paths,history}=typeof module!=='undefined'&&module.exports?require('./journey-data.js'):root.LifeJourney;
  const byId = new Map(species.map(s => [s.id,s]));
  const realCount=species.filter(s=>!s.fantasy).length;
  const realProgress=s=>s.found.filter(f=>!byId.get(f.id).fantasy).length;
  const attributes = [{key:'power',name:'体魄',note:'每点产能 +3% · 强壮巨兽'}, {key:'agility',name:'灵巧',note:'每点演化 +1.5% · 昆虫飞羽'}, {key:'adaptation',name:'适应',note:'每点产能、演化 +1% · 绿洲共生'}, {key:'perception',name:'感知',note:'每点产能 +1.5% · 深蓝探索'}, {key:'intelligence',name:'智慧',note:'每点研发费用 −2%，最多 −40% · 智慧共生'}, {key:'fertility',name:'繁衍',note:'每点每种生命额外 +0.05 能量/秒 · 多样繁盛'}];
  const skills=[{key:'metabolism',name:'光合代谢',base:120,note:'每级使总产能 +20%'},{key:'foraging',name:'觅食本能',base:250,note:'每级每种已发现生命额外 +0.15 能量/秒'},{key:'symbiosis',name:'共生网络',base:500,note:'每级每个已抵达章节使总产能 +4%'},
    {key:'respiration',name:'细胞呼吸',base:180,note:'每级使总产能 +12%'},{key:'recycling',name:'养分循环',base:300,note:'每级每种已发现生命额外 +0.12 能量/秒'},
    {key:'storage',name:'能量储存',base:400,note:'每级使总产能 +8%'},{key:'hunting',name:'感官捕食',base:600,note:'每级增加 2 能量/秒，感知每点再增加 0.2'},
    {key:'cooperation',name:'群体协作',base:800,note:'每级使总产能增加 6%，智慧每点额外增加 0.5%'},{key:'resilience',name:'逆境代谢',base:1000,note:'每级使总产能增加 5%，适应每点额外增加 0.5%'}];
  const defaultAttrs=()=>Object.fromEntries(attributes.map(a=>[a.key,0]));
  const defaultSkills=()=>Object.fromEntries(skills.map(s=>[s.key,0]));
  const events = [
    {name:'火山灰飘来了',note:'天边的灰云改变了日照。生命可以等待，也可以追随新的热量。',options:[
      {name:'躲进温暖的岩隙',note:'适应 +2 · 体魄 −1 · 产能 −20% / 120秒',attrs:{adaptation:2,power:-1},energy:-.2,evolution:0,duration:120,label:'岩隙庇护'},
      {name:'追逐地热的暖流',note:'体魄 +2 · 灵巧 −1 · 产能 +35%、演化 −15% / 120秒',attrs:{power:2,agility:-1},energy:.35,evolution:-.15,duration:120,label:'地热丰饶'}]},
    {name:'营养潮汐',note:'一股丰饶的水流经过。先储备养分，还是让更多可能性诞生？',options:[
      {name:'把养分留给未来',note:'体魄 +1 · 产能 +30%、演化 −10% / 180秒',attrs:{power:1},energy:.3,evolution:-.1,duration:180,label:'营养储备'},
      {name:'趁现在探索新形态',note:'灵巧 +2 · 产能 −15%、演化 +35% / 150秒',attrs:{agility:2},energy:-.15,evolution:.35,duration:150,label:'形态涌现'}]},
    {name:'漫长的寒流',note:'温度开始下降。有的生命选择休养，有的生命开始迁移。',options:[
      {name:'放慢脚步，适应寒冷',note:'适应 +2 · 演化 −20% / 150秒',attrs:{adaptation:2},energy:0,evolution:-.2,duration:150,label:'寒流休眠'},
      {name:'追着暖意向远方迁移',note:'灵巧 +2 · 体魄 −1 · 演化 +25%、产能 −20% / 150秒',attrs:{agility:2,power:-1},energy:-.2,evolution:.25,duration:150,label:'远方暖意'}]},
    {name:'氧气的礼物',note:'空气的变化为更强的身体与更轻盈的生活带来了机会。',options:[
      {name:'让身体更加强壮',note:'体魄 +2 · 产能 +25% / 120秒',attrs:{power:2},energy:.25,evolution:0,duration:120,label:'旺盛代谢'},
      {name:'向更轻盈的方向生长',note:'灵巧 +2 · 适应 −1 · 演化 +30% / 120秒',attrs:{agility:2,adaptation:-1},energy:0,evolution:.3,duration:120,label:'轻盈新生'}]},
    {name:'水岸渐渐退去',note:'潮水退后，露出了一片陌生地面。留下或踏出去，会写下不同故事。',options:[
      {name:'守住熟悉的水域',note:'适应 +1 · 产能 +20% / 180秒',attrs:{adaptation:1},energy:.2,evolution:0,duration:180,label:'安稳水域'},
      {name:'试探岸上的新世界',note:'适应 +2 · 灵巧 +1 · 产能 −30%、演化 +35% / 180秒',attrs:{adaptation:2,agility:1},energy:-.3,evolution:.35,duration:180,label:'登陆先驱'}]},
    {name:'一位新的邻居',note:'新的生命靠近了栖息地。合作与竞争都会改变这片生态。',options:[
      {name:'共享一片栖息地',note:'适应 +2 · 体魄 −1 · 产能 +15%、演化 +15% / 180秒',attrs:{adaptation:2,power:-1},energy:.15,evolution:.15,duration:180,label:'共生约定'},
      {name:'为自己争取更多空间',note:'体魄 +3 · 适应 −1 · 产能 +40%、演化 −20% / 150秒',attrs:{power:3,adaptation:-1},energy:.4,evolution:-.2,duration:150,label:'领地扩张'}]},
    {name:'星尘划过夜空',note:'一道光划过安静夜幕。稳住节奏，还是迎接未知？',options:[
      {name:'守住当下的生长节奏',note:'适应 +1 · 产能 +20% / 120秒',attrs:{adaptation:1},energy:.2,evolution:0,duration:120,label:'安静星夜'},
      {name:'迎接一次大胆的改变',note:'灵巧 +3 · 体魄 −2 · 演化 +45%、产能 −25% / 120秒',attrs:{agility:3,power:-2},energy:-.25,evolution:.45,duration:120,label:'星尘变异'}]},
    {name:'盛夏的长日',note:'漫长白昼送来充沛光照。积累与繁盛之间，又有新的选择。',options:[
      {name:'把阳光储存在身体里',note:'体魄 +1 · 适应 +1 · 产能 +25% / 180秒',attrs:{power:1,adaptation:1},energy:.25,evolution:0,duration:180,label:'长日储能'},
      {name:'让生活变得更加多样',note:'灵巧 +1 · 适应 +1 · 演化 +25%、产能 −10% / 180秒',attrs:{agility:1,adaptation:1},energy:-.1,evolution:.25,duration:180,label:'多样盛夏'}]}
  ];
  const ambientCount=events.length;
  events.push(...history);
  const historyAt=[0,300,1200,2400,4200,6000,7800,10200,12600,15000,17400];
  const speeds=[.5,1,2,5,10];
  function random(s){let x=s.randomState;x^=x<<13;x^=x>>>17;x^=x<<5;s.randomState=x>>>0||1;return s.randomState/4294967296;}
  function scheduleEvent(s){s.nextEvent=s.age+90+Math.floor(random(s)*271);}
  function create(seed){
    const s={version:3,speed:1,randomState:((seed??Math.floor(Math.random()*4294967295)+1)>>>0)||1,age:0,fraction:0,evolution:0,energy:0,total:0,level:0,paused:false,savedAt:Date.now(),attrs:defaultAttrs(),skills:defaultSkills(),points:5,found:[{id:'cell',age:0}],buffs:[],pending:null,eventIndex:0,nextEvent:0,eventLog:[],historyIndex:0,lineage:newLineage(0)};
    scheduleEvent(s);return s;
  }
  const count = s => s.found.length;
  const has = (s,id) => s.found.some(x=>x.id===id);
  const latest = s => s.lineage?byId.get(s.lineage.stages.flatMap(x=>x.ids)[progress(s)-1]):byId.get(s.found[s.found.length-1].id);
  const affinity = life => attributes[life.variant%6];
  const journeySize=41;
  function newLineage(origin){return {origin,progress:1,root:null,stages:[{group:0,key:'shared',reason:'共同的微观序章',ids:species.filter(x=>x.group===0).slice(0,12).map(x=>x.id)}]};}
  const progress=s=>s.lineage?.progress??1;
  function dominant(s,excluded){return attributes.filter(a=>a.key!==excluded).reduce((best,a)=>s.attrs[a.key]>s.attrs[best.key]?a:best).key;}
  const stageIndex=n=>n<12?0:n<36?1+Math.floor((n-12)/6):n<40?5:6;
  function stagePlan(s,index,rootKey){
    if(index===0)return newLineage(0).stages[0];
    const key=rootKey??s.lineage.root??dominant(s),path=paths[key];
    const group=index<=4?path.groups[index-1]:index===5?15:16;
    const chosen=new Set(s.lineage.stages.flatMap(x=>x.ids));
    let pool=species.filter(x=>x.group===group&&!chosen.has(x.id));
    if(index>=5)pool=pool.filter(x=>(index===5?path.forest:path.ends).includes(x.variant));
    const secondary=dominant(s,key),order=attributes.filter(a=>a.key!==key).sort((a,b)=>s.attrs[b.key]-s.attrs[a.key]);
    // Primary stats select the main branch; secondary stats select forms within it.
    const score=x=>{
      if(index===6){
        const target=path.ends.indexOf(x.variant),traits=attributes.filter(a=>a.key!==key);
        return traits.reduce((v,a,i)=>v+(i%path.ends.length===target?s.attrs[a.key]:0),0)-target*.001;
      }
      const k=affinity(x).key;return k===key?-1:s.attrs[k]*10+5-order.findIndex(a=>a.key===k);
    };
    pool.sort((a,b)=>score(b)-score(a)||a.variant-b.variant);
    return {group,key:secondary,reason:`${attributes.find(a=>a.key===key).name}主线 · ${attributes.find(a=>a.key===secondary).name}倾向 ${s.attrs[secondary]}（按进入阶段时的属性锁定）`,ids:pool.slice(0,index<=4?6:index===5?4:1).map(x=>x.id)};
  }
  function route(s){
    const key=s.lineage.root??dominant(s),path=paths[key];
    return {key,name:path.name,groups:[0,...path.groups,15,16],locked:!!s.lineage.root,
      note:s.lineage.root?'主线已锁定；加点与事件仍会影响尚未进入阶段的具体形态和最终结局。':'首次分化将在第12步后锁定。最高属性决定主线；同分按体魄、灵巧、适应、感知、智慧、繁衍顺序。',
      stages:s.lineage.stages,preview:s.lineage.stages.length>=7?null:stagePlan(s,s.lineage.stages.length,key),total:journeySize};
  }
  function next(s){
    if(progress(s)>=journeySize)return null;
    const index=stageIndex(progress(s)),stage=s.lineage.stages[index]??stagePlan(s,index);
    const offset=index===0?progress(s):index<=4?(progress(s)-12)%6:index===5?progress(s)-36:0;
    return byId.get(stage.ids[offset]);
  }
  function lockStage(s){
    const index=stageIndex(progress(s));
    if(!s.lineage.stages[index]){
      s.lineage.root??=dominant(s);
      s.lineage.stages.push(stagePlan(s,index));
    }
  }
  const fantasyReady=s=>progress(s)>=36;
  const modifier = (s,key) => Math.max(.25,Math.min(2.5,1+s.buffs.reduce((v,b)=>v+b[key],0)));
  const chapterCount=s=>new Set(s.found.map(f=>byId.get(f.id).group)).size;
  const skillLevel=(s,key)=>s.skills?.[key]??0;
  const skillCost=(s,key)=>{const skill=skills.find(x=>x.key===key);return skill?Math.ceil(skill.base*Math.pow(1.65,skillLevel(s,key))*(1-Math.min(.4,(s.attrs.intelligence??0)*.02))):Infinity;};
  function learn(s,key){if(!skills.some(x=>x.key===key)||skillLevel(s,key)>=12||s.energy<skillCost(s,key))return false;s.energy-=skillCost(s,key);s.skills??=defaultSkills();s.skills[key]++;return true;}
  function skillEffect(s,key){
    const lv=skillLevel(s,key);
    switch(key){
      case 'metabolism':return lv*.2;
      case 'foraging':return count(s)*lv*.15;
      case 'symbiosis':return lv*chapterCount(s)*.04;
      case 'respiration':return lv*.12;
      case 'recycling':return count(s)*lv*.12;
      case 'storage':return lv*.08;
      case 'hunting':return lv*(2+s.attrs.perception*.2);
      case 'cooperation':return lv*(.06+s.attrs.intelligence*.005);
      case 'resilience':return lv*(.05+s.attrs.adaptation*.005);
      default:return 0;
    }
  }
  const flatSkills=['foraging','recycling','hunting'];
  const rate = s => ((1+(count(s)-1)*1.8)*(1+s.level*.18)+count(s)*s.attrs.fertility*.05+flatSkills.reduce((v,k)=>v+skillEffect(s,k),0))*(1+s.attrs.power*.03+s.attrs.adaptation*.01+s.attrs.perception*.015)*skills.filter(x=>!flatSkills.includes(x.key)).reduce((v,x)=>v*(1+skillEffect(s,x.key)),1)*modifier(s,'energy');
  const evolutionRate = s => (s.speed??1)*(1+s.attrs.agility*.015+s.attrs.adaptation*.01)*modifier(s,'evolution');
  function setSpeed(s,speed){if(!speeds.includes(speed))return false;s.speed=speed;return true;}
  const cost = s => Math.round(25*Math.pow(1.55,s.level));
  const journeyAt=n=>n===0?0:n===1?45:n===2?120:120+(n-2)*600;
  const threshold = s => progress(s)<journeySize?s.lineage.origin+journeyAt(progress(s)):null;
  function allocate(s,key) {
    if(!attributes.some(a=>a.key===key)||s.points<1)return false;
    s.attrs[key]++;s.points--;return true;
  }
  function choose(s,index) {
    if(!s.pending||!Number.isInteger(index)||index<0||index>1)return false;
    const event=events[s.pending.index],option=event.options[index];
    for(const [key,amount] of Object.entries(option.attrs))s.attrs[key]=Math.max(0,s.attrs[key]+amount);
    s.buffs.push({label:option.label,energy:option.energy,evolution:option.evolution,expires:s.age+option.duration});
    s.eventLog.unshift({name:event.name,choice:option.name,age:s.age,automatic:false});s.eventLog=s.eventLog.slice(0,8);
    s.pending=null;scheduleEvent(s);return true;
  }
  function choicePreview(s,index){
    if(!s.pending)return '';
    const copy={...s,attrs:{...s.attrs}};
    for(const [key,v] of Object.entries(events[s.pending.index].options[index].attrs))copy.attrs[key]=Math.max(0,copy.attrs[key]+v);
    const path=route(copy);
    return !path.locked?`主线预测：${path.name}`:path.preview?`下次分化预测：${byId.get(path.preview.ids[0]).name}；已锁定主线保持不变`:'最终形态已锁定，本次仍改变属性与产能';
  }
  function advance(s,seconds) {
    if(s.paused||!Number.isFinite(seconds)||seconds<=0)return s;
    const elapsed=Math.min(seconds,28800)+s.fraction,ticks=Math.floor(elapsed);s.fraction=elapsed-ticks;
    for(let i=0;i<ticks;i++){
      s.age++;s.buffs=s.buffs.filter(b=>b.expires>s.age);
      if(!s.pending&&s.age>=s.nextEvent){s.pending={index:s.historyIndex<history.length&&s.evolution-s.lineage.origin>=historyAt[s.historyIndex]?ambientCount+s.historyIndex++:Math.floor(random(s)*ambientCount)};s.eventIndex++;s.nextEvent=null;}
      const gain=rate(s);s.energy+=gain;s.total+=gain;s.evolution+=evolutionRate(s);
      while(progress(s)<journeySize&&s.evolution>=threshold(s)){
        lockStage(s);const life=next(s);
        if(!has(s,life.id)){s.found.push({id:life.id,age:s.age});if(count(s)%5===0)s.points+=2;}
        s.lineage.progress++;
      }
      if(s.age%5===0&&s.level<50&&s.energy>=cost(s)){s.energy-=cost(s);s.level++;}
    }
    return s;
  }
  function basic(s){return !!s&&['age','fraction','energy','total','level','savedAt'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&Number.isInteger(s.age)&&Number.isInteger(s.level)&&s.level<=50&&s.fraction<1&&s.energy<=s.total&&s.age<=1e9&&s.total<=1e15&&typeof s.paused==='boolean';}
  function valid(s){
    if(!basic(s))return false;
    if(s.version===1)return true;
    if(s.speed!==undefined&&!speeds.includes(s.speed))return false;
    if(![2,3].includes(s.version)||!s.attrs||!attributes.every((a,i)=>(i>=3&&s.attrs[a.key]===undefined)||(Number.isInteger(s.attrs[a.key])&&s.attrs[a.key]>=0&&s.attrs[a.key]<=1e6))||!Number.isInteger(s.points)||s.points<0||s.points>1e6||!Number.isFinite(s.evolution)||s.evolution<0||s.evolution>1e12)return false;
    if(s.skills!==undefined&&(!s.skills||!skills.every(x=>(s.version===2&&s.skills[x.key]===undefined)||(Number.isInteger(s.skills[x.key])&&s.skills[x.key]>=0&&s.skills[x.key]<=12))))return false;
    if(!Array.isArray(s.found)||s.found.length<1||s.found.length>species.length||!s.found.every(x=>x&&byId.has(x.id)&&Number.isInteger(x.age)&&x.age>=0&&x.age<=s.age)||s.found[0].id!=='cell'||new Set(s.found.map(x=>x.id)).size!==s.found.length)return false;
    if(s.version===3){
      const l=s.lineage;
      if(!l||!Number.isFinite(l.origin)||l.origin<0||l.origin>s.evolution||!Number.isInteger(l.progress)||l.progress<1||l.progress>journeySize||!(l.root===null||Object.hasOwn(paths,l.root))||!Array.isArray(l.stages)||l.stages.length<1||l.stages.length>7)return false;
      if(!Number.isInteger(s.historyIndex)||s.historyIndex<0||s.historyIndex>history.length)return false;
      const used=new Set();
      for(let i=0;i<l.stages.length;i++){
        const st=l.stages[i],expected=i===0?12:i<=4?6:i===5?4:1;
        if(!st||!Number.isInteger(st.group)||st.group<0||st.group>=chapters.length||typeof st.key!=='string'||typeof st.reason!=='string'||st.reason.length>200||!Array.isArray(st.ids)||st.ids.length!==expected)return false;
        if(i>0&&(!l.root||st.group!==(i<=4?paths[l.root].groups[i-1]:i===5?15:16)))return false;
        if(new Set(st.ids).size!==st.ids.length||!st.ids.every(id=>byId.has(id)&&byId.get(id).group===st.group&&!used.has(id)))return false;
        if(i>=5&&!st.ids.every(id=>(i===5?paths[l.root].forest:paths[l.root].ends).includes(byId.get(id).variant)))return false;
        st.ids.forEach(id=>used.add(id));
      }
      const ids=l.stages.flatMap(x=>x.ids);
      if(l.stages[0].ids[0]!=='cell'||ids.length<l.progress||!ids.slice(0,l.progress).every(id=>s.found.some(f=>f.id===id)))return false;
      // Stages may be prepared only when reached, never arbitrary future branches.
      if(l.stages.length!==stageIndex(l.progress-1)+1)return false;
    }
    if(!Array.isArray(s.buffs)||s.buffs.length>10||!s.buffs.every(b=>b&&typeof b.label==='string'&&b.label.length<50&&Number.isFinite(b.energy)&&Math.abs(b.energy)<=1&&Number.isFinite(b.evolution)&&Math.abs(b.evolution)<=1&&Number.isInteger(b.expires)&&b.expires>=0&&b.expires<=s.age+180))return false;
    if(s.randomState!==undefined&&(!Number.isInteger(s.randomState)||s.randomState<1||s.randomState>4294967295))return false;
    if(!Number.isInteger(s.eventIndex)||s.eventIndex<0||(s.nextEvent!==null&&(!Number.isInteger(s.nextEvent)||s.nextEvent<0)))return false;
    if(s.pending===null&&s.nextEvent===null)return false;
    if(s.pending!==null&&(!s.pending||!Number.isInteger(s.pending.index)||!events[s.pending.index]))return false;
    return Array.isArray(s.eventLog)&&s.eventLog.length<=8&&s.eventLog.every(e=>e&&typeof e.name==='string'&&e.name.length<50&&typeof e.choice==='string'&&e.choice.length<50&&Number.isInteger(e.age)&&e.age>=0&&e.age<=s.age&&typeof e.automatic==='boolean');
  }
  function migrate(s){
    if(!valid(s))throw Error('invalid save');
    if(s.version===2||s.version===3){
      const copy={...JSON.parse(JSON.stringify(s)),speed:s.speed??1};
      copy.attrs={...defaultAttrs(),...copy.attrs};copy.skills={...defaultSkills(),...copy.skills};
      if(copy.randomState===undefined){copy.randomState=(copy.savedAt>>>0)||1;if(copy.pending){copy.pending={index:copy.pending.index};copy.nextEvent=null;}else scheduleEvent(copy);}
      if(copy.version===2){copy.version=3;copy.lineage=newLineage(copy.evolution);copy.historyIndex=0;}
      return copy;
    }
    const fresh=create();for(const k of ['age','fraction','energy','total','level','paused','savedAt'])fresh[k]=s[k];
    fresh.evolution=s.age;scheduleEvent(fresh);
    fresh.found=species.filter(x=>x.at<=s.age).map(x=>({id:x.id,age:x.at}));fresh.points=5+Math.floor(fresh.found.length/5)*2;fresh.lineage=newLineage(fresh.evolution);return fresh;
  }
  const api={species,chapters,realCount,realProgress,progress,journeySize,journeyAt,fantasyReady,history,skillEffect,flatSkills,attributes,skills,skillLevel,skillCost,learn,chapterCount,events,speeds,setSpeed,create,count,has,latest,next,affinity,route,modifier,rate,evolutionRate,cost,threshold,allocate,choose,choicePreview,advance,valid,migrate};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Life = api;
})(typeof window === 'undefined' ? globalThis : window);
