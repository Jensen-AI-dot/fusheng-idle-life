const test=require('node:test');
const assert=require('node:assert/strict');
const L=require('./engine.js');
const finish=s=>{L.setSpeed(s,10);L.advance(s,10000);return s;};
test('a run follows one permanent branch and stops without collecting every species',()=>{
  const endings=new Set();
  for(const a of L.attributes){const s=L.create(1);L.allocate(s,a.key);finish(s);
    assert.equal(L.progress(s),41);assert.ok(L.count(s)<100);assert.equal(L.route(s).key,a.key);
    endings.add(L.latest(s).id);const ids=s.found.map(f=>f.id);L.advance(s,20000);assert.deepEqual(s.found.map(f=>f.id),ids);assert.ok(L.valid(s));}
  assert.equal(endings.size,6);
});
test('locked branches survive attribute changes but later stage forms respond',()=>{
  const s=L.create();L.allocate(s,'power');L.setSpeed(s,10);L.advance(s,700);
  assert.equal(L.route(s).key,'power');const stages=structuredClone(s.lineage.stages);
  s.attrs.perception=100;L.advance(s,600);assert.equal(L.route(s).key,'power');
  assert.deepEqual(s.lineage.stages.slice(0,stages.length),stages);
});
test('event choices change the branch and eventual ending from the same starting state',()=>{
  const a=L.create(1),b=structuredClone(a);L.advance(a,a.nextEvent);L.advance(b,b.nextEvent);
  L.choose(a,0);L.choose(b,1);finish(a);finish(b);
  assert.notEqual(L.route(a).key,L.route(b).key);assert.notEqual(L.latest(a).id,L.latest(b).id);
});
test('all nine energy skills can reach level twelve, never thirteen',()=>{
  assert.equal(L.skills.length,9);
  for(const skill of L.skills){const s=L.create();s.energy=s.total=1e12;const before=L.rate(s);
    for(let i=0;i<12;i++)assert.ok(L.learn(s,skill.key));assert.equal(L.skillLevel(s,skill.key),12);
    assert.equal(L.learn(s,skill.key),false);assert.ok(L.rate(s)>before);assert.ok(L.valid(s));}
});
test('historical events are chronological, single occurrence, sourced and indefinitely pending',()=>{
  const s=L.create(7),seen=[];
  for(let i=0;i<300&&seen.length<L.history.length;i++){
    L.advance(s,s.nextEvent-s.age);const e=L.events[s.pending.index];if(!e.historical){L.choose(s,0);continue;}seen.push(e.mya);
    assert.equal(e.historical,true);assert.match(e.source,/^https:\/\//);const pending=structuredClone(s.pending);
    L.advance(s,400);assert.deepEqual(s.pending,pending);assert.ok(L.choose(s,i%2));}
  assert.equal(seen.length,L.history.length);assert.equal(new Set(seen).size,seen.length);assert.deepEqual(seen,[...seen].sort((a,b)=>b-a));
});
test('legacy archives and skills migrate without reset and continue a separate single journey',()=>{
  const s=L.create();delete s.lineage;delete s.historyIndex;s.version=2;
  s.age=s.evolution=28800;s.found=L.species.slice(0,200).map(x=>({id:x.id,age:x.at}));s.skills={metabolism:5,foraging:2,symbiosis:1};
  s.energy=123;s.total=999;s.level=20;const restored=L.migrate(s);
  assert.equal(restored.found.length,200);assert.equal(restored.energy,123);assert.equal(restored.skills.metabolism,5);
  assert.equal(L.progress(restored),1);finish(restored);assert.ok(L.valid(restored));assert.equal(L.progress(restored),41);
  assert.equal(restored.found.filter(f=>f.id==='cell').length,1);assert.ok(restored.found.length<340);
});

test('secondary choices after main-branch lock can still change the final fantasy ending',()=>{
  const a=L.create();a.attrs.power=100;L.setSpeed(a,10);L.advance(a,2232);
  assert.equal(L.progress(a),40);assert.equal(a.lineage.stages.length,6);const b=structuredClone(a);
  a.attrs.fertility=20;b.attrs.intelligence=20;L.advance(a,100);L.advance(b,100);
  assert.equal(a.lineage.root,b.lineage.root);assert.notEqual(L.latest(a).id,L.latest(b).id);assert.ok(L.valid(a));assert.ok(L.valid(b));
});
test('lineage saves reject duplicate, foreign-branch and incomplete stage data',()=>{
  const s=finish(L.create());
  for(const alter of [t=>t.lineage.stages[0].ids[1]='cell',t=>t.lineage.progress=42,t=>t.lineage.stages.pop(),t=>t.lineage.stages[6].ids[0]='life-340']){
    const t=structuredClone(s);alter(t);assert.equal(L.valid(t),false);
  }
});
test('all twenty final forms are reachable through secondary attribute choices',()=>{
  const endings=new Set();
  for(const root of L.attributes){
    const start=L.create(9);start.attrs[root.key]=100;L.setSpeed(start,10);
    while(L.progress(start)<40)L.advance(start,1);
    for(const secondary of L.attributes.filter(a=>a.key!==root.key)){
      const s=structuredClone(start);s.attrs[secondary.key]=50;finish(s);endings.add(L.latest(s).id);assert.ok(L.valid(s));
    }
  }
  assert.equal(endings.size,20);
});

