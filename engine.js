(function (root) {
  'use strict';
  const data = typeof module !== 'undefined' && module.exports ? require('./species-data.js') : root.LifeData;
  const { species, chapters } = data;
  const byId = new Map(species.map(s => [s.id,s]));
  const attributes = [{key:'power',name:'体魄',note:'每点产能 +3% · 强壮巨兽'}, {key:'agility',name:'灵巧',note:'每点演化 +1.5% · 昆虫飞羽'}, {key:'adaptation',name:'适应',note:'每点产能、演化 +1% · 绿洲共生'}, {key:'perception',name:'感知',note:'每点产能 +1.5% · 深蓝探索'}, {key:'intelligence',name:'智慧',note:'每点研发费用 −2%，最多 −40% · 智慧共生'}, {key:'fertility',name:'繁衍',note:'每点每种生命额外 +0.05 能量/秒 · 多样繁盛'}];
  const skills=[{key:'metabolism',name:'光合代谢',base:120,note:'每级使总产能 +20%'},{key:'foraging',name:'觅食本能',base:250,note:'每级每种已发现生命额外 +0.15 能量/秒'},{key:'symbiosis',name:'共生网络',base:500,note:'每级每个已抵达章节使总产能 +4%'}];
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
  const speeds=[.5,1,2,5,10];
  function random(s){let x=s.randomState;x^=x<<13;x^=x>>>17;x^=x<<5;s.randomState=x>>>0||1;return s.randomState/4294967296;}
  function scheduleEvent(s){s.nextEvent=s.age+90+Math.floor(random(s)*271);}
  function create(seed){
    const s={version:2,speed:1,randomState:((seed??Math.floor(Math.random()*4294967295)+1)>>>0)||1,age:0,fraction:0,evolution:0,energy:0,total:0,level:0,paused:false,savedAt:Date.now(),attrs:defaultAttrs(),skills:defaultSkills(),points:5,found:[{id:'cell',age:0}],buffs:[],pending:null,eventIndex:0,nextEvent:0,eventLog:[]};
    scheduleEvent(s);return s;
  }
  const count = s => s.found.length;
  const has = (s,id) => s.found.some(x=>x.id===id);
  const latest = s => byId.get(s.found[s.found.length-1].id);
  const affinity = life => attributes[life.variant%6];
  function route(s) {
    const maximum=Math.max(...attributes.map(a=>s.attrs[a.key]??0));
    if(maximum>0){
      if((s.attrs.perception??0)===maximum)return {name:'深蓝探索',key:'perception',groups:[0,1,3,2,6,4,5,8,9,7],note:'感知引领发现，更早探索广阔海域。'};
      if((s.attrs.intelligence??0)===maximum)return {name:'智慧共生',key:'intelligence',groups:[0,1,4,5,8,9,6,3,2,7],note:'智慧引领发现，优先复杂、多样的共生生态。'};
      if((s.attrs.fertility??0)===maximum)return {name:'多样繁盛',key:'fertility',groups:[0,1,4,5,2,3,6,9,8,7],note:'繁衍引领发现，优先绿意与多样的小生命。'};
    }
    const {power:p,agility:a,adaptation:d}=s.attrs;
    if(p===a&&a===d)return {name:'自然漫游',key:'balanced',groups:[0,1,2,3,4,5,6,7,8,9],note:'均衡生长，沿着自然章节慢慢发现。'};
    if(p>=a&&p>=d)return {name:'强壮巨兽',key:'power',groups:[0,1,2,3,6,7,9,4,5,8],note:'体魄引领后续发现，优先水岸、巨兽与哺乳类群。'};
    if(a>=d)return {name:'轻盈飞羽',key:'agility',groups:[0,1,2,3,5,8,4,6,9,7],note:'灵巧引领后续发现，优先林间微旅与天空来信。'};
    return {name:'适应共生',key:'adaptation',groups:[0,1,4,2,3,6,5,9,8,7],note:'适应引领后续发现，更早抵达绿洲与多样生态。'};
  }
  function next(s) {
    if(count(s)>=species.length)return null;
    const known=new Set(s.found.map(x=>x.id));
    for(const group of route(s).groups){
      const candidates=species.filter(x=>x.group===group&&!known.has(x.id));
      if(candidates.length)return candidates.reduce((best,x)=>s.attrs[affinity(x).key]>s.attrs[affinity(best).key]?x:best);
    }
    return null;
  }
  const modifier = (s,key) => Math.max(.25,Math.min(2.5,1+s.buffs.reduce((v,b)=>v+b[key],0)));
  const chapterCount=s=>new Set(s.found.map(f=>byId.get(f.id).group)).size;
  const skillLevel=(s,key)=>s.skills?.[key]??0;
  const skillCost=(s,key)=>{const skill=skills.find(x=>x.key===key);return skill?Math.ceil(skill.base*Math.pow(2.4,skillLevel(s,key))*(1-Math.min(.4,(s.attrs.intelligence??0)*.02))):Infinity;};
  function learn(s,key){if(!skills.some(x=>x.key===key)||skillLevel(s,key)>=5||s.energy<skillCost(s,key))return false;s.energy-=skillCost(s,key);s.skills??=defaultSkills();s.skills[key]++;return true;}
  const rate = s => ((1+(count(s)-1)*1.8)*(1+s.level*.18)+count(s)*((s.attrs.fertility??0)*.05+skillLevel(s,'foraging')*.15))*(1+s.attrs.power*.03+s.attrs.adaptation*.01+(s.attrs.perception??0)*.015)*(1+skillLevel(s,'metabolism')*.2)*(1+skillLevel(s,'symbiosis')*chapterCount(s)*.04)*modifier(s,'energy');
  const evolutionRate = s => (s.speed??1)*(1+s.attrs.agility*.015+s.attrs.adaptation*.01)*modifier(s,'evolution');
  function setSpeed(s,speed){if(!speeds.includes(speed))return false;s.speed=speed;return true;}
  const cost = s => Math.round(25*Math.pow(1.55,s.level));
  const threshold = s => count(s)<species.length?species[count(s)].at:null;
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
  function advance(s,seconds) {
    if(s.paused||!Number.isFinite(seconds)||seconds<=0)return s;
    const elapsed=Math.min(seconds,28800)+s.fraction,ticks=Math.floor(elapsed);s.fraction=elapsed-ticks;
    for(let i=0;i<ticks;i++){
      s.age++;s.buffs=s.buffs.filter(b=>b.expires>s.age);
      if(!s.pending&&s.age>=s.nextEvent){s.pending={index:Math.floor(random(s)*events.length)};s.eventIndex++;s.nextEvent=null;}
      const gain=rate(s);s.energy+=gain;s.total+=gain;s.evolution+=evolutionRate(s);
      while(count(s)<species.length&&s.evolution>=threshold(s)){
        const life=next(s);s.found.push({id:life.id,age:s.age});if(count(s)%5===0)s.points+=2;
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
    if(s.version!==2||!s.attrs||!attributes.every((a,i)=>(i>=3&&s.attrs[a.key]===undefined)||(Number.isInteger(s.attrs[a.key])&&s.attrs[a.key]>=0&&s.attrs[a.key]<=1e6))||!Number.isInteger(s.points)||s.points<0||s.points>1e6||!Number.isFinite(s.evolution)||s.evolution<0||s.evolution>1e12)return false;
    if(s.skills!==undefined&&(!s.skills||!skills.every(x=>Number.isInteger(s.skills[x.key])&&s.skills[x.key]>=0&&s.skills[x.key]<=5)))return false;
    if(!Array.isArray(s.found)||s.found.length<1||s.found.length>200||!s.found.every(x=>x&&byId.has(x.id)&&Number.isInteger(x.age)&&x.age>=0&&x.age<=s.age)||s.found[0].id!=='cell'||new Set(s.found.map(x=>x.id)).size!==s.found.length)return false;
    if(!Array.isArray(s.buffs)||s.buffs.length>10||!s.buffs.every(b=>b&&typeof b.label==='string'&&b.label.length<50&&Number.isFinite(b.energy)&&Math.abs(b.energy)<=1&&Number.isFinite(b.evolution)&&Math.abs(b.evolution)<=1&&Number.isInteger(b.expires)&&b.expires>=0&&b.expires<=s.age+180))return false;
    if(s.randomState!==undefined&&(!Number.isInteger(s.randomState)||s.randomState<1||s.randomState>4294967295))return false;
    if(!Number.isInteger(s.eventIndex)||s.eventIndex<0||(s.nextEvent!==null&&(!Number.isInteger(s.nextEvent)||s.nextEvent<0)))return false;
    if(s.pending===null&&s.nextEvent===null)return false;
    if(s.pending!==null&&(!s.pending||!Number.isInteger(s.pending.index)||!events[s.pending.index]))return false;
    return Array.isArray(s.eventLog)&&s.eventLog.length<=8&&s.eventLog.every(e=>e&&typeof e.name==='string'&&e.name.length<50&&typeof e.choice==='string'&&e.choice.length<50&&Number.isInteger(e.age)&&e.age>=0&&e.age<=s.age&&typeof e.automatic==='boolean');
  }
  function migrate(s){
    if(!valid(s))throw Error('invalid save');
    if(s.version===2){
      const copy={...JSON.parse(JSON.stringify(s)),speed:s.speed??1};
      copy.attrs={...defaultAttrs(),...copy.attrs};copy.skills={...defaultSkills(),...copy.skills};
      if(copy.randomState===undefined){copy.randomState=(copy.savedAt>>>0)||1;if(copy.pending){copy.pending={index:copy.pending.index};copy.nextEvent=null;}else scheduleEvent(copy);}
      return copy;
    }
    const fresh=create();for(const k of ['age','fraction','energy','total','level','paused','savedAt'])fresh[k]=s[k];
    fresh.evolution=s.age;scheduleEvent(fresh);
    fresh.found=species.filter(x=>x.at<=s.age).map(x=>({id:x.id,age:x.at}));fresh.points=5+Math.floor(fresh.found.length/5)*2;return fresh;
  }
  const api={species,chapters,attributes,skills,skillLevel,skillCost,learn,chapterCount,events,speeds,setSpeed,create,count,has,latest,next,affinity,route,modifier,rate,evolutionRate,cost,threshold,allocate,choose,advance,valid,migrate};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Life = api;
})(typeof window === 'undefined' ? globalThis : window);
