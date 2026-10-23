'use strict';
const $ = id => document.getElementById(id);
const L = window.Life;
const Art = window.LifeArt;
function paintArtwork(){document.querySelectorAll('.species-art').forEach(el=>{if(Art.paint(el.querySelector('canvas'),Number(el.dataset.artGroup),Number(el.dataset.artVariant)))el.classList.add('ready');});}
window.addEventListener('life-art-ready',paintArtwork);
function selectTab(name, focus = false){
  document.querySelectorAll('[data-tab]').forEach(tab=>{
    const active=tab.dataset.tab===name;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
    $('pane-'+tab.dataset.tab).hidden=!active;if(active&&focus)tab.focus();
  });
}
$('tab-cultivate').parentElement.addEventListener('click',e=>{const tab=e.target.closest('[data-tab]');if(tab)selectTab(tab.dataset.tab);});
$('tab-cultivate').parentElement.addEventListener('keydown',e=>{
  const tabs=[...document.querySelectorAll('[data-tab]')],index=tabs.indexOf(e.target);if(index<0)return;
  const target=e.key==='ArrowRight'?(index+1)%tabs.length:e.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;
  if(target!==null){e.preventDefault();selectTab(tabs[target].dataset.tab,true);}
});
const KEY = 'fusheng-life-v4';
let state = L.create(), selected = 'cell', filter = 'all', chapter = 'all', slow = matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer, saveWarning = false, sessionSeconds = 0, eventKey = '', lastProgress = 1;
const escapeHtml = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'm' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : Math.floor(n).toLocaleString('en-US');
const duration = n => n >= 60 ? Math.ceil(n / 60) + ' 分钟' : Math.ceil(n) + ' 秒';
const clock = n => [Math.floor(n / 3600), Math.floor(n / 60) % 60, Math.floor(n) % 60].map(x => String(x).padStart(2, '0')).join(':');
function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 5000); }
function save() {
  state.savedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(state)); $('save-status').textContent = '◈ 进度自动保存于此浏览器'; }
  catch { $('save-status').textContent = '存储不可用，请导出存档保留进度'; if (!saveWarning) { toast('浏览器存储不可用，请通过存档管理导出进度。'); saveWarning = true; } }
}
function restore() {
  try {
    const raw = localStorage.getItem(KEY)??localStorage.getItem('fusheng-life-v3')??localStorage.getItem('fusheng-life-v1'); if (!raw) return;
    const restored = JSON.parse(raw); if (!L.valid(restored)) { toast('原存档无法读取，已开始新的生命旅程。'); return; }
    state = L.migrate(restored);
    const away = Math.min(28800, Math.max(0, (Date.now() - state.savedAt) / 1000));
    const before = state.total; L.advance(state, away);
    if (away >= 60) toast(state.paused ? '欢迎回来，生态缸仍保持暂停。' : `欢迎回来！离线生长 ${duration(away)}，获得 ${format(state.total - before)} 能量。`);
    if(restored.version<3)toast('旧图鉴、能量、属性和技能已保留；从本次回来开启新的单线演化旅程。');
    else if(restored.version<4)toast('原有进度已保留，生命特性与遗传传承已开放。');
    selected = L.latest(state).id;
  } catch { toast('原存档无法读取，已开始新的生命旅程。'); }
}
function icon(s, locked = false, large = false) {
  if (locked) return '<span aria-hidden="true">♧</span>';
  const shapes = {
    cell: '<circle cx="20" cy="20" r="13" fill="currentColor" opacity=".16"/><circle cx="20" cy="20" r="12" fill="none" stroke="currentColor"/><circle cx="22" cy="19" r="4" fill="currentColor"/><circle cx="15" cy="24" r="2" fill="currentColor" opacity=".6"/>',
    algae: '<g fill="currentColor" opacity=".7"><ellipse cx="14" cy="15" rx="5" ry="7"/><ellipse cx="25" cy="12" rx="5" ry="7"/><ellipse cx="20" cy="26" rx="5" ry="7"/><ellipse cx="30" cy="24" rx="4" ry="6"/></g>',
    jelly: '<path d="M7 21C7 2 33 2 33 21Q20 28 7 21Z" fill="currentColor" opacity=".5"/><path d="M12 24Q8 31 14 36M20 25Q24 31 19 38M28 24Q33 30 27 35" fill="none" stroke="currentColor"/>',
    trilobite: '<ellipse cx="20" cy="20" rx="10" ry="16" fill="currentColor" opacity=".4"/><path d="M10 13H30M10 18H30M10 23H30M13 28H27M20 5V35" stroke="currentColor" fill="none"/>',
    fish: '<path d="M5 20L1 12V28L5 20Q20 1 36 20Q20 39 5 20" fill="currentColor" opacity=".65"/><circle cx="28" cy="18" r="2" fill="#173a31"/>',
    amphibian: '<path d="M9 22L3 13M11 24L3 32M27 21L34 12M27 24L36 31M15 26L12 38" stroke="currentColor" stroke-width="3"/><ellipse cx="21" cy="20" rx="13" ry="7" fill="currentColor"/>',
    reptile: '<path d="M32 20Q20 6 14 22Q10 33 2 33M18 19L13 10M23 22L28 31M15 23L10 29M27 18L31 11" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    bird: '<path d="M3 25Q11 5 20 19Q25 6 37 10L27 25L16 28Z" fill="currentColor" opacity=".65"/><circle cx="28" cy="19" r="5" fill="currentColor"/>',
    plant: '<path d="M20 36V8M20 20Q4 22 7 8Q20 6 20 20M20 28Q36 29 34 14Q20 13 20 28" fill="currentColor" opacity=".65"/>',
    insect: '<ellipse cx="20" cy="23" rx="7" ry="10" fill="currentColor" opacity=".7"/><circle cx="20" cy="10" r="5" fill="currentColor"/><path d="M14 17L4 11M14 23H3M14 28L5 35M26 17L36 11M26 23H37M26 28L35 35M17 7L13 2M23 7L27 2" stroke="currentColor" fill="none"/>',
    dinosaur: '<path d="M3 25L13 20Q17 6 25 12L30 8L37 15L30 21L24 22L25 35H20L18 26L14 35H10L12 25Z" fill="currentColor" opacity=".7"/>',
    mammal: '<ellipse cx="18" cy="22" rx="13" ry="8" fill="currentColor" opacity=".65"/><circle cx="30" cy="17" r="7" fill="currentColor"/><path d="M27 13L26 6L32 11M12 26V35M24 26V35M6 21L1 13" stroke="currentColor" stroke-width="3"/>'
  };
  const key = ['cell','algae','jelly','trilobite','fish','amphibian','reptile','bird','plant','insect','dinosaur','mammal'][s.type];
  Art.image(s.group);
  return `<span class="species-art" data-art-group="${s.group}" data-art-variant="${s.variant}"><canvas width="${large?112:48}" height="${large?112:48}" aria-hidden="true"></canvas><svg viewBox="0 0 40 40" aria-hidden="true" style="color:${s.color}">${shapes[key]}</svg></span>`;
}
function renderList() {
  $('species-list').innerHTML = L.species.filter(s => (filter === 'all' || L.has(state,s.id)) && (chapter === 'all' || s.group === Number(chapter))).map(s => {
    const unlocked = L.has(state,s.id);
    return `<button class="species-card ${unlocked ? '' : 'locked'} ${selected === s.id ? 'selected' : ''}" data-id="${s.id}" aria-label="${s.name}${unlocked ? '，查看图鉴' : '，尚未发现'}" aria-pressed="${selected === s.id}"><span class="species-icon">${icon(s, !unlocked)}</span><span class="species-text"><b>${s.name}</b><small>${String(L.species.indexOf(s)+1).padStart(3,'0')} · ${unlocked ? s.era : '尚未相遇'}</small></span><span class="species-end">${unlocked ? '↗' : '·'}</span></button>`;
  }).join('');
  paintArtwork();
}
function showDetail(id) {
  const s = L.species.find(x => x.id === id); selected = id; renderList();
  const open = L.has(state,s.id), trait = L.affinity(s), gated=s.fantasy&&!L.fantasyReady(state);
  $('dialog-content').innerHTML = `<div class="dialog-visual">${icon(s,false,true)}</div><div class="eyebrow">${s.fantasy?'ORIGINAL FANTASY · ':open?'DISCOVERED · ':''}${s.kind}</div><h2>${s.name}</h2><p style="color:${s.color}">${s.note}</p><p>${gated?'走完本轮真实阶段，即进入所属主线的幻想演化，无需集齐其他路线。'+s.detail:open?s.detail:s.detail+' 本轮只发展一条路线；它可能属于其他分支。加点与事件决定尚未锁定的阶段，不能改写已锁定分支。'}</p><p class="trait-label">${s.fantasy?'原创幻想 · ':''}演化倾向：${trait.name} · ${s.kind}</p><div class="eyebrow">${s.latin.toUpperCase()}</div>`;
  paintArtwork();
  $('detail').showModal();
}
function render() {
  const count = L.count(state), current = L.latest(state), next = L.next(state);
  $('compact-phase').textContent=`${L.progress(state)} / ${L.journeySize} 步`;
  $('compact-level').textContent=`Lv.${state.level}`;
  $('watch').textContent = clock(sessionSeconds);
  $('energy').innerHTML = format(state.energy) + '<span> EL</span>';
  $('rate').textContent = state.paused ? '0.0' : L.rate(state).toFixed(1);
  $('collection-count').textContent = String(count).padStart(3, '0') + ' / '+L.species.length;
  const step=L.progress(state),fantasyUnlocked=L.fantasyReady(state),path=L.route(state);
  $('phase-status').textContent=`本轮 ${step} / ${L.journeySize} 步 · ${fantasyUnlocked?'幻想演化':'真实生命阶段'}。`+(path.preview?`下次分化预测：${L.species.find(s=>s.id===path.preview.ids[0]).name}（分化前可改变）`:`最终形态：${L.latest(state).name}`);
  document.body.classList.toggle('fantasy-world',fantasyUnlocked);
  $('era-index').textContent = `CHAPTER ${String(current.group+1).padStart(2, '0')} · ${current.latin.toUpperCase()}`;
  $('world').setAttribute('aria-label',`当前生物：${current.name}；生态缸仅展示此形态。`);
  $('era-name').textContent = current.name; $('era-note').textContent = current.note;
  $('world-time').textContent = current.fantasy?'幻想纪元 · 原创设定':`历史进程 · ${state.historyIndex?L.history[state.historyIndex-1].date:'微观生命序章'}`;
  $('next-title').textContent = next ? '下一次相遇' : '生命仍在继续';
  $('next-eta').textContent = next ? (state.paused ? '等待恢复' : '约 '+duration(Math.max(0,L.threshold(state)-state.evolution)/L.evolutionRate(state)) + '后') : '本轮演化完成';
  $('next-name').innerHTML = (next ? next.name : current.name) + '<span>✧</span>';
  const previous = state.lineage.origin+L.journeyAt(step-1);
  $('next-progress').style.width = (next ? Math.min(100,Math.max(0,(state.evolution-previous)/(L.threshold(state)-previous)*100)) : 100) + '%';
  $('next-note').textContent = next ? `本轮第 ${step+1} / ${L.journeySize} 步 · ${next.fantasy?'原创幻想 · ':''}${next.era}` : `本轮终点：${current.name}。此后持续获取生命能量，不会补走其他路线。`;
  $('upgrade-level').textContent = 'Lv. ' + state.level;
  $('upgrade-note').textContent = state.level < 50 ? `下一次升级需要 ${format(L.cost(state))} 能量，自动完成。` : '生态已达最高等级，继续自在生长。';
  $('habitat-state').textContent = state.paused ? '观察暂停' : '生态稳定';
  $('auto-label').textContent = state.paused ? '演化已暂停' : '自动演化已开启';
  $('pause').textContent = state.paused ? '▷ 继续观察' : 'Ⅱ 暂停观察';
  $('motion').setAttribute('aria-pressed', String(slow));
  $('motion').setAttribute('aria-label',slow?'舒缓动效，已开启':'舒缓动效，已关闭');
  $('motion').textContent = slow ? '≈ 舒缓中' : '≈ 舒缓动效';
  $('speed').value=String(state.speed??1);
  $('journal').innerHTML = state.found.slice(-3).reverse().map(f => { const s=L.species.find(x=>x.id===f.id);return `<li>${f.age ? '发现了'+s.name : '第一颗细胞诞生了'}<small>${clock(f.age)} · ${s.era}</small></li>`; }).join('');
  renderDecisions();
  renderCultivation();
  if (step !== lastProgress) { selected = current.id; renderList(); toast(`演化第 ${step} 步：${current.name}。`); lastProgress = step; }
}
function renderDecisions() {
  const path = L.route(state);
  $('route-name').textContent = (path.locked?'已锁定 · ':'主线预测 · ')+path.name;
  $('route-note').textContent = path.note;
  let passed=0;
  $('route-path').innerHTML=path.groups.map((group,i)=>{
    const stage=path.stages[i],size=i===0?12:i<=4?6:i===5?4:1,done=Math.min(size,Math.max(0,L.progress(state)-passed));passed+=size;
    return `<button data-chapter="${group}" title="${escapeHtml(stage?stage.reason:'未锁定：加点与事件可以改变具体形态')}" class="route-node ${done===size?'complete':done?'started':''}"><span>${L.chapters[group].name}</span><small>${done}/${size} · ${stage?'已锁定':'预测'}</small></button>`;
  }).join('<span class="route-arrow">›</span>');
  $('point-count').textContent = `可用 ${state.points} 点`;
  $('decision-hint').textContent=state.pending?'· 事件待选择':state.points?`· ${state.points} 点可分配`:'';
  const stats=L.effectiveAttrs(state);
  for(const a of L.attributes){$('stat-'+a.key).textContent=stats[a.key];$('stat-source-'+a.key).textContent=`基础 ${state.attrs[a.key]} · 特性 +${(state.traits[L.traits.find(t=>t.attr===a.key).key]??0)*2} · 遗传 +${state.heritage.genes[a.key]}`;document.querySelector(`[data-stat="${a.key}"]`).disabled=state.points<1;}
  $('skill-production').textContent=`当前产能 ${state.paused?'0.0':L.rate(state).toFixed(1)} / 秒`;
  for(const skill of L.skills){
    const level=L.skillLevel(state,skill.key),button=$('learn-'+skill.key),price=L.skillCost(state,skill.key);
    $('skill-level-'+skill.key).textContent=`Lv. ${level} / 12`;
    button.disabled=level>=12||state.energy<price;
    button.textContent=level>=12?'已达满级':`${level?'升级':'解锁'} · ${format(price)} EL`;
    const effect=L.skillEffect(state,skill.key);
    $('skill-effect-'+skill.key).textContent=L.flatSkills.includes(skill.key)?`当前固定增益 +${effect.toFixed(2)} 能量/秒（参与产能加成）`:`当前总产能加成 +${(effect*100).toFixed(1)}%`;
  }
  $('evolution-speed').textContent = `演化速度 ×${L.evolutionRate(state).toFixed(2)}`;
  const pct=n=>(n>=0?'+':'')+Math.round(n*100)+'%';
  $('buffs').innerHTML = state.buffs.length?state.buffs.map(b=>`<div class="buff"><span>${escapeHtml(b.label)}<small>${b.energy?'产能 '+pct(b.energy)+' ':''}${b.evolution?'演化 '+pct(b.evolution):''}</small></span><b>${Math.max(0,b.expires-state.age)}s</b></div>`).join(''):'<p class="empty-buff">此刻风平浪静，世界事件会带来新的变化。</p>';
  const pending=state.pending,key=pending?pending.index+'-'+state.eventIndex+'-'+L.attributes.map(a=>stats[a.key]).join(',')+'-'+state.lineage.stages.length:'waiting';
  $('event-badge').hidden=!pending;
  $('tab-events').setAttribute('aria-label',pending?'事件，有待选择事件':'事件');
  $('event-clock').textContent = pending?'等待你的选择 · 无时间限制':state.paused?'演化暂停':'随机来临 · 无固定间隔';
  if(key!==eventKey){
    eventKey=key;
    if(pending){const event=L.events[pending.index];$('event-content').innerHTML=`<div class="event-title"><span>◇</span><h3>${event.name}</h3></div><p>${event.historical?escapeHtml(event.date)+"<br>":""}${escapeHtml(event.note)}</p>${event.historical?`<a class="history-source" href="${event.source}" target="_blank" rel="noopener noreferrer">史实资料 ↗</a><p class="event-help">以下属性与增减益为游戏设计。</p>`:""}<div class="event-options">${event.options.map((o,i)=>`<button data-choice="${i}"><b>${i+1}. ${o.name}</b><small>${o.note}</small><small class="route-impact">${escapeHtml(L.choicePreview(state,i))}</small></button>`).join('')}</div><p class="event-help">没有选择时间限制，挂机成长会照常继续。选择永久改变属性，并影响尚未锁定的分化；增减益限时生效。负向属性最低减至 0。</p>`;
    }else $('event-content').innerHTML='<div class="event-title"><span>✧</span><h3>世界正在悄悄改变</h3></div><p>事件会在不固定的时间随机出现。它会一直等待你决定，自动成长照常继续；处理后，下一次事件将在随机间隔后到来。</p><div class="event-wait">一段等待，也是一段生长。</div>';
  }
  const last=state.eventLog[0];
  $('event-recent').textContent=last?`${last.automatic?'历史自动应对':'你的选择'} · ${last.name} → ${last.choice}`:'让世界自由生长，变化会在不经意间到来。';
}
function cultivationPrediction(key,gene=false){
  const copy={...state,traits:{...state.traits},heritage:{...state.heritage,genes:{...state.heritage.genes}}};
  if(gene)copy.heritage.genes[key]++;else copy.traits[key]++;
  const path=L.route(copy);
  return !path.locked?`培育后主线预测：${path.name}`:path.preview?`下次分化预测：${L.species.find(s=>s.id===path.preview.ids[0]).name}`:gene?'终点已锁定；属性仍影响产能，并在下一轮继续生效。':'终点已锁定；本轮仍提升属性与产能，助力积累遗传点。';
}
function renderCultivation(){
  for(const t of L.traits){
    const level=state.traits[t.key],price=L.traitCost(state,t.key),button=$('trait-'+t.key);
    $('trait-level-'+t.key).textContent=`Lv. ${level} / 12`;
    $('trait-effect-'+t.key).textContent=`本轮${L.attributes.find(a=>a.key===t.attr).name} +${level*2} · ${level>=12?'已满级，本轮常驻；重开后清零。':cultivationPrediction(t.key)}`;
    button.disabled=level>=12||state.energy<price;button.textContent=level>=12?'已达满级':`${level?'强化':'培育'} · ${format(price)} EL`;
  }
  const h=state.heritage;
  $('generation-label').textContent=`第 ${h.generation+1} 代生命`;
  $('heritage-points').textContent=format(h.points);$('heritage-pending').textContent=format(h.pending);
  $('heritage-exchange-note').textContent=`兑换费用随累计兑换次数递增，每点比上次增加 2.5m EL；重开后费用不重置。已累计兑换 ${format(h.converted)} 点。`;
  for(const [id,n] of [['exchange-one',1],['exchange-ten',10]]){
    const price=L.heritageCost(state,n),button=$(id);button.disabled=state.energy<price||h.converted+n>1e6;button.textContent=`兑换 ${n} 点 · ${format(price)} EL`;
  }
  for(const a of L.attributes){
    const level=h.genes[a.key],price=L.geneCost(state,a.key),button=$('gene-'+a.key);
    $('gene-level-'+a.key).textContent=`Lv. ${level}`;
    $('gene-effect-'+a.key).textContent=`永久${a.name} +${level} · ${cultivationPrediction(a.key,true)}`;
    button.disabled=h.points<price;button.textContent=`培育 +1 · ${format(price)} 遗传点`;
  }
}
$('trait-cards').innerHTML=L.traits.map(t=>`<article class="skill-card"><div><h3>${t.name}</h3><small id="trait-level-${t.key}"></small></div><p>${t.note} 每级${L.attributes.find(a=>a.key===t.attr).name} +2。</p><small class="skill-effect" id="trait-effect-${t.key}"></small><button class="soft-button" id="trait-${t.key}" data-trait="${t.key}"></button></article>`).join('');
$('gene-cards').innerHTML=L.attributes.map(a=>`<article class="skill-card"><div><h3>${a.name}基因</h3><small id="gene-level-${a.key}"></small></div><p>每级永久${a.name} +1。升级消耗“当前等级 +1”遗传点，已培育基因重开后保留。</p><small class="skill-effect" id="gene-effect-${a.key}"></small><button class="soft-button" id="gene-${a.key}" data-gene="${a.key}"></button></article>`).join('');
$('trait-cards').addEventListener('click',e=>{const b=e.target.closest('[data-trait]');if(b){sync();if(L.developTrait(state,b.dataset.trait)){save();render();toast('生命特性已生效：属性与未锁定分化的预测已更新。');}else{render();toast('生命能量不足，或特性已满级。');}}});
$('gene-cards').addEventListener('click',e=>{const b=e.target.closest('[data-gene]');if(b){sync();if(L.developGene(state,b.dataset.gene)){save();render();toast('遗传基因已培育，本轮与未来每轮都会获得加成。');}else{render();toast('可用遗传点不足；本轮待传承点需要重开后才能使用。');}}});
for(const [id,n] of [['exchange-one',1],['exchange-ten',10]])$(id).addEventListener('click',()=>{sync();if(L.exchangeHeritage(state,n)){save();render();toast(`获得 ${n} 点待传承点，下次重新开始后可用于培育。`);}else{render();toast('当前生命能量不足，或累计兑换已达上限。');}});
$('heritage-restart').addEventListener('click',()=>{$('save-menu').click();$('restart').click();});
$('attribute-rows').innerHTML=L.attributes.map(a=>`<div class="attribute-row"><div><b>${a.name}</b><small>${a.note}</small><small id="stat-source-${a.key}" class="stat-source"></small></div><strong id="stat-${a.key}">0</strong><button data-stat="${a.key}" aria-label="增加${a.name}，消耗1属性点">＋</button></div>`).join('');
$('skill-cards').innerHTML=L.skills.map(s=>`<article class="skill-card"><div><h3>${s.name}</h3><small id="skill-level-${s.key}"></small></div><p>${s.note}</p><small class="skill-effect" id="skill-effect-${s.key}"></small><button class="soft-button" id="learn-${s.key}" data-skill="${s.key}"></button></article>`).join('');
$('skill-cards').addEventListener('click',e=>{const b=e.target.closest('[data-skill]');if(b){sync();const before=L.rate(state);if(L.learn(state,b.dataset.skill)){save();render();toast(`技能已生效：产能 ${before.toFixed(1)} → ${L.rate(state).toFixed(1)} / 秒。`);}else{render();toast('当前能量不足，或该技能已满级。');}}});
$('attribute-rows').addEventListener('click',e=>{const b=e.target.closest('[data-stat]');if(b){sync();if(L.allocate(state,b.dataset.stat)){save();render();renderList();}}});
$('event-content').addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(b){sync();if(L.choose(state,Number(b.dataset.choice))){save();render();toast('选择已生效：属性与后续路线已更新。');}else{render();toast('这场事件已处理。');}}});
$('route-path').addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b){chapter=b.dataset.chapter;$('chapter').value=chapter;renderList();selectTab('collection');}});
$('jump-decisions').addEventListener('click',()=>{selectTab(state.pending?'events':'cultivate',true);});
restore(); lastProgress=L.progress(state);
$('chapter').innerHTML = `<option value="all">全图鉴 · ${L.species.length} 种可预览形态</option>` + L.chapters.map((c,i) => `<option value="${i}">${c.fantasy?'✧ ':''}${String(i+1).padStart(2,'0')} ${c.name} · 20 种</option>`).join('');
$('chapter').addEventListener('change', () => { chapter = $('chapter').value; renderList(); $('species-list').scrollTop = 0; });
renderList(); render();
$('species-list').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) showDetail(b.dataset.id); });
document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
  filter = b.dataset.filter; document.querySelectorAll('[data-filter]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); }); renderList();
}));
$('detail').querySelector('.dialog-close').addEventListener('click', () => $('detail').close());
$('detail').addEventListener('click', e => { if (e.target === $('detail')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
$('pause').addEventListener('click', () => { sync(); state.paused = !state.paused; save(); render(); });
$('motion').addEventListener('click', () => { slow = !slow; render(); });
$('speed').addEventListener('change',e=>{sync();if(L.setSpeed(state,Number(e.target.value))){save();render();toast(`演化速度已设为 ${state.speed}×，物种发现按此倍率推进。`);}});
$('focus').addEventListener('click', () => {
  const on = document.body.classList.toggle('focused'); $('focus').innerHTML = on ? '◱ 退出专注' : '<span>◱</span> 专注模式'; $('focus').setAttribute('aria-pressed', String(on));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('detail').open && document.body.classList.contains('focused')) $('focus').click(); });
$('scene-info').addEventListener('click', () => {
  $('dialog-content').innerHTML = '<div class="eyebrow">A SMALL WORLD OF YOUR OWN</div><h2>你的选择，写下这条生命线。</h2><p>340种生命形象供图鉴预览，包括300种真实生命和40种原创幻想生命。每轮演化只走41步：12步共同序章、24步真实分化、4步幻想新生和1个最终形态，不会在终点补完所有路线。</p><p>首次分化依据最高属性锁定主线；同分按体魄、灵巧、适应、感知、智慧、繁衍排序。后续阶段在进入时按属性锁定具体形态。事件与加点会影响尚未锁定的阶段和终点，已锁定分支不回溯。</p><p>基础旅程约6.4小时，可调整演化速度。每发现5种新生命获得2属性点。9项生命技能最高Lv.12，消耗生命能量研发。6项生命特性每级提供2属性，最高Lv.12，本轮重开后清零。多余能量可兑换待传承点，下次重开后用来培育永久基因，每级提供1属性。兑换费用随累计次数增加，基因升级费用为当前等级加1遗传点。遗传基因与未使用的遗传点重开后保留。生态等级仍自动升到50级。历史大事件按年代顺序在演化阶段内随机出现；事件无倒计时，待决定期间自动成长继续。史实与游戏效果分别标注。</p><p>旧存档的能量、技能、属性和图鉴发现全部保留，并从迁移时开始本轮单线旅程。进度自动保存，离线最多结算8小时；暂停时不成长。</p><p>这是生命形态的艺术演绎；相邻物种不表示直接祖先与后代，幻想形象和生态均为原创设定。</p>';

  $('detail').showModal();
});
$('save-menu').addEventListener('click', () => {
  $('dialog-content').innerHTML = '<div class="eyebrow">KEEP YOUR LITTLE WORLD</div><h2>留住这方小世界</h2><p>进度每 5 秒自动保存在当前浏览器。换电脑、清理浏览器数据前，可以导出一份存档。</p><button class="soft-button" id="export">↓ 导出存档</button><button class="soft-button" id="import">↑ 导入存档</button><button class="soft-button" id="restart">↻ 重新开始</button><p style="font-size:11px">导入会替换本轮及遗传数据；重新开始会清空本轮进度，保留遗传传承。需要时请先导出备份。</p>';
  $('detail').showModal();
  $('export').onclick = () => { sync(); save(); const url = URL.createObjectURL(new Blob([JSON.stringify(state)], {type:'application/json'})); const a = document.createElement('a'); a.href = url; a.download = '浮生-生命存档.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); toast('已导出当前生命存档。'); };
  $('import').onclick = () => $('import-file').click();
  $('restart').onclick = () => {
    $('dialog-content').innerHTML=`<div class="eyebrow">A NEW BEGINNING</div><h2>重新开始这段生命旅程？</h2><p>这会清空本轮图鉴、能量、手动加点、技能、生命特性与演化路线，从初始细胞重新开始。演化速度恢复为 1×。</p><p>遗传基因和可用遗传点会保留。本轮 ${format(state.heritage.pending)} 点待传承点将结转，重开后共有 ${format(state.heritage.points+state.heritage.pending)} 点可用遗传点。</p><p>如需保留这段旅程，请取消并先导出存档。</p><button class="soft-button" id="cancel-restart">取消，保留进度</button><button class="soft-button" id="confirm-restart">确认重新开始</button>`;
    $('cancel-restart').onclick=()=>$('detail').close();
    $('confirm-restart').onclick=()=>{
      state=L.restart(state);selected='cell';filter='all';chapter='all';sessionSeconds=0;eventKey='';lastProgress=1;
      lastTick=Date.now();lastSave=lastTick;sceneClock=0;lastFrame=0;
      $('chapter').value='all';
      document.querySelectorAll('[data-filter]').forEach(b=>{const on=b.dataset.filter==='all';b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
      save();renderList();render();$('species-list').scrollTop=0;$('detail').close();toast('新的旅程开始了，遗传基因已保留，待传承点已结转。');
    };
    $('cancel-restart').focus();
  };
});
$('import-file').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.size > 100000) throw Error('size');
    const imported = JSON.parse(await file.text()); if (!L.valid(imported)) throw Error('invalid');
    state = L.migrate(imported); state.savedAt=Date.now();
    lastTick = Date.now(); lastProgress=L.progress(state); selected = L.latest(state).id;
    save(); renderList(); render(); $('detail').close(); toast('存档已恢复，小世界回来了。');
  } catch { toast('这份存档无法读取，当前进度已保留。'); }
  e.target.value = '';
});
let lastTick = Date.now(), lastSave = lastTick;
function sync() { const now = Date.now(); const seconds = Math.max(0, (now - lastTick) / 1000); L.advance(state, seconds); sessionSeconds += Math.min(seconds, 2); lastTick = now; }
setInterval(() => { sync(); render(); if (Date.now() - lastSave >= 5000) { save(); lastSave = Date.now(); } }, 1000);
document.addEventListener('visibilitychange', () => { sync(); save(); render(); });
window.addEventListener('pagehide', () => { sync(); save(); });
window.addEventListener('storage', e => {
  if (e.key !== KEY || !e.newValue) return;
  try { const s = JSON.parse(e.newValue); if (L.valid(s)) { state = L.migrate(s); lastTick = Date.now(); render(); renderList(); } } catch { /* Keep current state when another tab writes invalid data. */ }
});

// Render the complete observation scene at low resolution for pixel scaling.
const canvas = $('world'), ctx = canvas.getContext('2d');
let w = 600, h = 520, sceneClock = 0, lastFrame = 0;
const rand = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function resize() { const r=canvas.getBoundingClientRect();w=r.width;h=r.height;canvas.width=Math.max(1,Math.round(w/3));canvas.height=Math.max(1,Math.round(h/3));ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.imageSmoothingEnabled=true; }
new ResizeObserver(resize).observe(canvas);
function ellipse(x,y,rx,ry,color,stroke) { ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); if(color){ctx.fillStyle=color;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.8;ctx.stroke();} }
function line(points,color,width=1) { ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(); }
function cell(t) {
  ctx.beginPath();for(let i=0;i<=60;i++){const a=i/60*Math.PI*2,r=25+Math.sin(a*5+t)*1.7;const x=Math.cos(a)*r,y=Math.sin(a)*r*.9;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();
  const g=ctx.createRadialGradient(-7,-6,1,0,0,28);g.addColorStop(0,'#b5e8ab50');g.addColorStop(.7,'#91cfaa15');g.addColorStop(1,'#c6f3bc60');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#c8edb480';ctx.lineWidth=1;ctx.stroke();
  ellipse(3,-2,8,7,'#b6d89460','#d8edaa80');ellipse(5,-4,3,3,'#dbe7a782');
  for(let i=0;i<7;i++){const a=i*2.4;ellipse(Math.cos(a)*15,Math.sin(a)*13,1.5+i%2,1.5,'#d6efb445');}
  ctx.beginPath();ctx.arc(0,0,20,3.4,4.7);ctx.strokeStyle='#d9f7c599';ctx.stroke();
}
function algae(t) {
  for(let i=0;i<7;i++){const a=i*2.4,x=Math.sin(a)*17,y=Math.cos(a)*20;ctx.save();ctx.translate(x,y);ctx.rotate(a+t*.04);ellipse(0,0,6,12,'#b8d77b50','#c7e69088');ellipse(0,-1,2.5,6,'#d9ec9460');ctx.restore();}
}
function jelly(t,v=4) {
  if(v<3||v>=9){
    for(let i=0;i<8;i++){const angle=(i-3.5)*.21,bend=Math.sin(t*.7+i)*5;ctx.beginPath();ctx.moveTo(0,23);ctx.bezierCurveTo(Math.sin(angle)*35,-5,Math.sin(angle)*44+bend,-35,Math.sin(angle)*50+bend,-48+Math.cos(i)*10);ctx.strokeStyle=v<3?'#d9cdb466':'#dcb9d866';ctx.lineWidth=v<3?8:3;ctx.stroke();}
    ellipse(0,24,17,4,'#998a7055');return;
  }
  for(let i=0;i<9;i++){const x=(i-4)*5;ctx.beginPath();ctx.moveTo(x,7);ctx.bezierCurveTo(x-14*Math.sin(t+i),37,x+16*Math.sin(t+i*.7),55,x+Math.sin(t+i)*14,75+Math.sin(i)*10);ctx.strokeStyle=i%2?'#c5a6dc70':'#c4d8d945';ctx.lineWidth=i%2?1.1:1.8;ctx.stroke();}
  const pulse=1+Math.sin(t*1.7)*.055;ctx.save();ctx.scale(pulse,1/pulse);const g=ctx.createRadialGradient(-8,-12,1,0,-5,34);g.addColorStop(0,'#f3d8eb80');g.addColorStop(.6,'#c1a3e238');g.addColorStop(1,'#ddb9e97a');ctx.beginPath();ctx.moveTo(-31,10);ctx.bezierCurveTo(-36,-42,36,-42,31,10);ctx.quadraticCurveTo(0,23,-31,10);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#e8d3ee9a';ctx.lineWidth=.8;ctx.stroke();
  for(let i=0;i<4;i++)ellipse(Math.cos(i*Math.PI/2)*7,Math.sin(i*Math.PI/2)*5-3,5,4,'#e3c7f34a');ctx.restore();
}
function trilobite(t,v=0) {
  if(v>=2&&v<=5){
    ellipse(0,0,25,22,'#a6bba945','#ddcaa28a');ctx.beginPath();for(let i=0;i<120;i++){const a=i*.15,r=i*.17;i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(0,0);}ctx.strokeStyle='#d9bd8ca0';ctx.lineWidth=1.5;ctx.stroke();return;
  }
  if(v>=6&&v<=9){ctx.beginPath();ctx.moveTo(0,19);ctx.arc(0,0,25,Math.PI*.8,Math.PI*2.2);ctx.closePath();ctx.fillStyle='#d0b98a66';ctx.fill();for(let i=0;i<8;i++)line([[0,19],[Math.cos(Math.PI*.8+i*.2*Math.PI)*23,Math.sin(Math.PI*.8+i*.2*Math.PI)*23]],'#dfce9c77');return;}
  if(v>=10&&v<=14){for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo((i-3.5)*9,20,(i-3.5)*12+Math.sin(t+i)*10,30,(i-3.5)*10,46);ctx.strokeStyle='#d3c1b780';ctx.lineWidth=3;ctx.stroke();}ellipse(0,-10,17,22,'#c8b5a280');ellipse(8,-4,3,3,'#142d29');return;}
  for(let i=0;i<9;i++){const y=-22+i*6,r=16-Math.abs(i-3)*1.3;line([[-r+3,y],[-r-7,y+Math.sin(t*3+i)*3]],'#d5ad7670');line([[r-3,y],[r+7,y+Math.sin(t*3+i)*3]],'#d5ad7670');ellipse(0,y,r,4,'#ad956344','#d9bb8270');}
  ellipse(0,-26,15,9,'#afaa7160','#e1c68d80');line([[0,-23],[0,28]],'#e2c393b0',2);ellipse(-8,-28,2,2,'#e6d99a');ellipse(8,-28,2,2,'#e6d99a');
}
function fish(t,v=0) {
  if(v===9||v===12){ctx.beginPath();ctx.moveTo(28,0);ctx.quadraticCurveTo(-2,-5,-35,-35);ctx.quadraticCurveTo(-31,0,-35,35);ctx.quadraticCurveTo(-2,5,28,0);ctx.fillStyle='#9ccebb90';ctx.fill();line([[-25,0],[-57,Math.sin(t)*7]],'#b4d7c5a0',2);ellipse(17,-3,2,2,'#203d31');return;}
  if(v===13){ctx.beginPath();ctx.moveTo(10,-23);ctx.bezierCurveTo(-25,-23,-16,3,-5,10);ctx.bezierCurveTo(25,38,-30,40,-14,21);ctx.strokeStyle='#c5d2a6b0';ctx.lineWidth=8;ctx.stroke();ellipse(8,-24,10,7,'#c5d2a6b0');line([[15,-22],[28,-18]],'#c5d2a6b0',5);ellipse(10,-26,2,2,'#203c30');return;}
  ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(-43,-18+Math.sin(t*4)*3);ctx.quadraticCurveTo(-34,0,-43,18+Math.sin(t*4)*3);ctx.closePath();ctx.fillStyle='#82c6c17a';ctx.fill();
  ctx.beginPath();ctx.moveTo(-10,-9);ctx.lineTo(-2,-25);ctx.lineTo(16,-9);ctx.fillStyle='#a9d8b455';ctx.fill();
  const g=ctx.createLinearGradient(0,-14,0,14);g.addColorStop(0,'#99cbbfb0');g.addColorStop(.45,'#aeddd6bc');g.addColorStop(1,'#426f6c90');ellipse(0,0,30,13,g,'#c2ece49a');
  ctx.beginPath();ctx.moveTo(3,2);ctx.quadraticCurveTo(-8,23,-13,13);ctx.closePath();ctx.fillStyle='#a8d6ca70';ctx.fill();ellipse(20,-3,3,3,'#152c29','#c1e7c5');ellipse(21,-4,1,1,'#eff5ce');line([[12,-9],[9,0],[12,9]],'#406a6480');
}
function lizard(t, isReptile,v=0) {
  if(isReptile&&(v===17||v===18)){ellipse(0,0,23,19,'#a9b37e88','#d0d6a277');for(let i=0;i<4;i++){const a=i*Math.PI/2+.6;ellipse(Math.cos(a)*23,Math.sin(a)*20,7,3,'#a6bb85');}ellipse(26,0,8,5,'#b9c491');for(let i=0;i<6;i++){const a=i*Math.PI/3;line([[0,0],[Math.cos(a)*22,Math.sin(a)*18]],'#59765c',1);}return;}
  if(isReptile&&v===19){ctx.beginPath();ctx.moveTo(-36,0);ctx.bezierCurveTo(-26,-27,13,27,20,0);ctx.bezierCurveTo(30,-23,15,-33,35,-35);ctx.strokeStyle='#c8ba83aa';ctx.lineWidth=6;ctx.stroke();ellipse(34,-35,8,5,'#d6c797');return;}
  const color=isReptile?'#d0a580':'#9fbc7c';ctx.strokeStyle=color;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-12,0);ctx.bezierCurveTo(-27,1,-25,28,-42,24+Math.sin(t*2)*4);ctx.stroke();
  for(let i=0;i<4;i++){const side=i%2?1:-1,x=i<2?10:-10,y=Math.sin(t*2+i)*3;line([[x,side*4],[x-7,side*14+y],[x+2,side*20+y]],color,3);for(let j=0;j<3;j++)line([[x+2,side*20+y],[x+7,side*20+y+(j-1)*4]],color,1);}
  ellipse(0,0,22,9,color+'c0');ellipse(20,-1,11,8,color);ellipse(24,-5,2,2,'#142b25');for(let i=0;i<7;i++)ellipse(-13+i*5,Math.sin(i*2)*4,1.4,1.5,'#405e3d88');
}
function bird(t) {
  const flap=Math.sin(t*2.3)*12;ctx.fillStyle='#dfcda3aa';ctx.beginPath();ctx.moveTo(-5,0);ctx.quadraticCurveTo(-23,-18-flap,-34,-27-flap);ctx.quadraticCurveTo(-7,-20,9,1);ctx.fill();
  ctx.beginPath();ctx.moveTo(0,2);ctx.quadraticCurveTo(8,-22+flap,27,-30+flap);ctx.quadraticCurveTo(19,-6,5,5);ctx.fillStyle='#eed9a4bb';ctx.fill();ellipse(0,3,14,6,'#c9b593');ellipse(12,0,6,6,'#e3cea7');line([[17,0],[24,2],[17,3]],'#e8ce79',2);ellipse(14,-2,1.2,1.2,'#263e30');line([[-13,3],[-27,9],[-20,0]],'#c6b398',3);
}
function plantLife(t,v=0){
  const size=v<5?.55:v<14?1:1.05;
  ctx.save();ctx.scale(size,size);plant(0,33,1,t,v);
  if(v>=14){const color=['#dfc2c6','#d3dce3','#dfb0c0','#e6cd84','#d9deca','#b1cb8b'][v-14];for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ellipse(Math.cos(a)*10,-35+Math.sin(a)*10,7,9,color+'aa');}ellipse(0,-35,6,6,'#ddc77cb0');}ctx.restore();
}
function insect(t,v=0){
  const wings=[5,6,7,15,16,18,19].includes(v),butterfly=v>=18;
  if(wings){for(let i=0;i<4;i++){ctx.save();ctx.rotate((i%2?1:-1)*(.3+Math.sin(t*5)*.18));ellipse((i%2?1:-1)*(butterfly?17:21),i<2?-7:9,butterfly?17:23,butterfly?16:5,(butterfly?'#92c0d6':'#c6d6ba')+'70','#d6e7ce60');if(butterfly)ellipse((i%2?1:-1)*18,i<2?-7:9,6,6,'#31554a66');ctx.restore();}}
  const legs=v===1||v===2?12:v===4?8:6;
  for(let i=0;i<legs;i++){const side=i%2?1:-1,y=-13+Math.floor(i/2)*30/(legs/2);line([[side*3,y],[side*14,y+Math.sin(t*3+i)*3],[side*20,y+7]],'#b8c296b0',1.4);}
  ellipse(0,7,v===14?14:7,v===14?16:20,'#bdc9949a','#e0dfac77');ellipse(0,-14,8,7,'#d6d8aaab');line([[-3,-19],[-10,-30]],'#d2d8ac99');line([[3,-19],[10,-30]],'#d2d8ac99');
  if(v===14)for(let i=0;i<6;i++)ellipse((i%2?1:-1)*5,Math.floor(i/2)*8,2,2,'#294c32');
  if(v===15){ctx.shadowBlur=20;ctx.shadowColor='#e2ee88';ellipse(0,19,5,5,'#e7ee9ecc');}
}
function dinosaur(t,v=0){
  const long=v>=5&&v<=9,armored=v===4||v===10,horned=v===11||v===12;
  ctx.beginPath();ctx.moveTo(-15,0);ctx.quadraticCurveTo(-42,9,-50,-8+Math.sin(t)*4);ctx.strokeStyle='#b7ba86a0';ctx.lineWidth=6;ctx.stroke();ellipse(0,0,27,15,'#b6b890b0');
  for(let i=0;i<4;i++){const x=(i<2?-14:13)+(i%2?3:-3),y=24+Math.sin(t*2+i)*3;line([[x,6],[x,y],[x+6,y]],'#b7ba8eb0',5);}
  if(long){ctx.beginPath();ctx.moveTo(16,-4);ctx.bezierCurveTo(29,-12,20,-52,39,-55);ctx.strokeStyle='#b9be92b0';ctx.lineWidth=10;ctx.stroke();ellipse(42,-55,10,6,'#c3c99e');ellipse(46,-57,1.5,1.5,'#213a2a');}
  else{ellipse(25,-10,17,11,'#c2c69a');ellipse(32,-14,2,2,'#233a2a');if(horned){for(let i=0;i<3;i++)line([[20+i*7,-17],[17+i*9,-31+i*3]],'#e0d8b0',3);}}
  if(armored)for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(-22+i*8,-8);ctx.lineTo(-20+i*8,-28+(i%2)*7);ctx.lineTo(-13+i*8,-9);ctx.fillStyle='#b2bd87';ctx.fill();}
}
function mammal(t,v=0){
  if(v===9){bird(t);return;}
  if(v===14||v===15){ctx.save();ctx.scale(v===15?1.6:1.2,v===15?1.5:.9);fish(t,17);ctx.restore();return;}
  const elephant=v===17,giraffe=v===16,hedge=v===2||v===7;
  ellipse(0,0,25,13,elephant?'#a8b5aaad':'#c4b292b0');
  for(let i=0;i<4;i++){const x=(i<2?-13:13)+(i%2?2:-2),y=23+Math.sin(t*2+i)*2;line([[x,7],[x,y]],'#c2b393b0',giraffe?3:5);}
  if(giraffe)line([[15,-3],[22,-42]],'#ccbd94',9);
  const hy=giraffe?-44:-9;ellipse(24,hy,12,9,elephant?'#a8b5aa':'#cfbd9e');ellipse(27,hy-3,1.8,1.8,'#293c2c');
  ellipse(18,hy-9,elephant?10:4,elephant?12:7,elephant?'#9daa9d':'#c2ad91');
  if(elephant){ctx.beginPath();ctx.moveTo(32,-6);ctx.quadraticCurveTo(44,26,34,24);ctx.strokeStyle='#a8b5aa';ctx.lineWidth=6;ctx.stroke();}
  else{ctx.beginPath();ctx.moveTo(-22,-2);ctx.quadraticCurveTo(-44,-15,-31,-31+Math.sin(t)*3);ctx.strokeStyle=v===10||v===12?'#d8c6a5b0':'#baa98d99';ctx.lineWidth=v===10?11:3;ctx.stroke();}
  if(hedge)for(let i=0;i<11;i++)line([[-23+i*4,-8+Math.abs(i-5)],[-24+i*4,-23+Math.abs(i-5)*2]],'#cec6a5',1.5);
  if(v===18){ellipse(19,-16,5,5,'#304639');ellipse(29,-11,4,5,'#304639');}
}
function plant(x,y,size,t,seed) {
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);const bend=Math.sin(t*.3+seed)*7;
  for(let j=0;j<5;j++){const tip=-48-j*12;ctx.beginPath();ctx.moveTo((j-2)*4,8);ctx.bezierCurveTo(-12+j*6,tip*.2,bend+(j-2)*12,tip*.8,bend+(j-2)*13,tip);ctx.strokeStyle=['#426d524b','#64865c4d','#71916a50'][j%3];ctx.lineWidth=3;ctx.stroke();
    for(let k=1;k<6;k++){const yy=tip*k/6,xx=(j-2)*4+(bend+(j-2)*9)*k/6;ctx.beginPath();ctx.moveTo(xx,yy);ctx.quadraticCurveTo(xx-15,yy+2,xx-12,yy-9);ctx.quadraticCurveTo(xx-2,yy-9,xx,yy);ctx.fillStyle='#60846040';ctx.fill();ctx.beginPath();ctx.moveTo(xx,yy+3);ctx.quadraticCurveTo(xx+14,yy+1,xx+12,yy-7);ctx.quadraticCurveTo(xx+3,yy-5,xx,yy+3);ctx.fill();}}
  ctx.restore();
}
function drawBackground(t) {
  const dreaming=L.latest(state).fantasy;
  ctx.fillStyle=dreaming?'#242d43':'#1e4030';ctx.fillRect(0,0,w,h);
  ctx.fillStyle=dreaming?'#303e54':'#2b5139';
  for(let i=0;i<5;i++)ctx.fillRect(Math.floor(w*(i*.25)-20),h*.28+Math.sin(i*5)*20,w*.17,h*.72);
  ctx.fillStyle=dreaming?'#314663':'#355f3e';
  for(let i=0;i<35;i++){const x=Math.floor(rand(i+4)*w/6)*6,y=Math.floor(((rand(i+90)*h-t*(1+rand(i)*3))%h+h)%h/6)*6;ctx.fillRect(x,y,i%5===0?6:3,i%5===0?6:3);}
  for(let i=0;i<12;i++){
    const x=i*w/11,top=h-24-rand(i+30)*28;
    ctx.fillStyle=dreaming?'#314452':'#3b5837';ctx.fillRect(x,top,w/11+2,h-top);
    ctx.fillStyle=dreaming?'#536476':'#7b9251';ctx.fillRect(x,top,w/11+2,6);
    ctx.fillStyle='#172f25';ctx.fillRect(x+12,top+12,9,6);
  }
  for(let i=0;i<9;i++)plant((i/8)*w,h-25-rand(i)*24,.35+rand(i+5)*.55,t,i);
}

const drawers=[cell,algae,jelly,trilobite,fish,(t,v)=>lizard(t,false,v),(t,v)=>lizard(t,true,v),bird,plantLife,insect,dinosaur,mammal];
function frame(now) {
  if(lastFrame&&now-lastFrame<1000/30){requestAnimationFrame(frame);return;}
  const dt=lastFrame?Math.min(.05,(now-lastFrame)/1000):0;lastFrame=now;
  if (!state.paused && !document.hidden) sceneClock+=dt*(slow?.25:1);
  if (!document.hidden) {
    const t=sceneClock;drawBackground(t);
    const life=L.latest(state),kind=life.type,seed=life.group*31+life.variant*7+12;
    const size=Math.min(260,w*.63,h*.43)*(kind<2?.65:kind===9?.8:1);
    const x=w*.5+Math.sin(t*.15+seed)*w*.065;
    let y=h*.62+Math.cos(t*.2+seed)*10;
    if([3,5,6,8,10,11].includes(kind))y=h-size*.55-55+Math.sin(t*.2+seed)*4;
    if(kind===7)y=h*.53+Math.sin(t*.3+seed)*17;
    ctx.save();ctx.translate(x,y);
    if(kind<2)ctx.rotate(Math.sin(t*.12+seed)*.15);
    const artwork=Art.image(life.group);
    if(artwork){
      const r=Art.cell(life,artwork),dh=size*r.h/r.w;
      if(kind<3){const pulse=1+Math.sin(t*1.3+seed)*.025;ctx.scale(pulse,1/pulse);}
      ctx.globalCompositeOperation='source-over';
      ctx.filter='none';
      ctx.drawImage(artwork,r.x,r.y,r.w,r.h,-size/2,-dh/2,size,dh);
    }else{
      ctx.scale(size/90,size/90);ctx.filter=`hue-rotate(${(life.variant%7-3)*8}deg)`;
      ctx.shadowBlur=kind<3?12:5;ctx.shadowColor=life.color+'22';drawers[kind](t+seed,life.variant);
    }
    ctx.restore();
    ctx.font='10px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.fillStyle='#bdcea4b0';ctx.fillText(life.name,x,y+size/2+12);
    const vignette=ctx.createRadialGradient(w/2,h*.5,h*.2,w/2,h*.5,Math.max(w,h)*.72);vignette.addColorStop(0,'#071b1700');vignette.addColorStop(1,'#041713a0');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
