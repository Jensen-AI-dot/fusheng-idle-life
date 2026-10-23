const test=require('node:test');
const assert=require('node:assert/strict');
const L=require('./engine.js');
const rich=()=>{const s=L.create(7);s.energy=s.total=1e12;return s;};
test('six energy traits improve effective attributes, select routes, and stop at Lv.12',()=>{
  assert.equal(L.traits.length,6);
  for(const trait of L.traits){
    const s=rich(),cost=L.traitCost(s,trait.key);assert.ok(L.developTrait(s,trait.key));
    assert.equal(s.energy,1e12-cost);assert.equal(s.attrs[trait.attr],0);assert.equal(L.effectiveAttrs(s)[trait.attr],2);
    assert.equal(L.route(s).key,trait.attr);
    for(let i=1;i<12;i++)assert.ok(L.developTrait(s,trait.key));
    assert.equal(L.developTrait(s,trait.key),false);assert.ok(L.valid(s));
  }
  const s=L.create();assert.equal(L.developTrait(s,L.traits[0].key),false);assert.equal(L.developTrait(s,'missing'),false);
});
test('traits do not rewrite locked stages but influence the pending final form',()=>{
  const a=rich();a.attrs.power=100;L.setSpeed(a,10);L.advance(a,2232);
  assert.equal(L.progress(a),40);const stages=structuredClone(a.lineage.stages),b=structuredClone(a);
  L.developTrait(a,'spores');L.developTrait(b,'neural');L.advance(a,100);L.advance(b,100);
  assert.deepEqual(a.lineage.stages.slice(0,6),stages);assert.equal(a.lineage.root,b.lineage.root);
  assert.notEqual(L.latest(a).id,L.latest(b).id);
});
test('gene conversion deducts exact batch prices and newly earned points wait for restart',()=>{
  const s=rich(),cost=L.heritageCost(s,10);assert.equal(cost,212500000);assert.ok(L.exchangeHeritage(s,10));
  assert.equal(s.energy,1e12-cost);assert.equal(s.heritage.pending,10);assert.equal(s.heritage.points,0);
  assert.equal(L.developGene(s,'power'),false);assert.ok(L.heritageCost(s,1)>L.heritageCost(L.create(),1));
  for(const n of [0,-1,1.2,11,NaN])assert.equal(L.exchangeHeritage(s,n),false);
  assert.equal(L.exchangeHeritage(L.create(),1),false);assert.ok(L.valid(s));
  const sequential=rich();for(let i=0;i<10;i++)L.exchangeHeritage(sequential,1);
  assert.equal(sequential.energy,s.energy);assert.deepEqual(sequential.heritage,s.heritage);
});
test('restart settles pending genes, resets the current run and cannot mint free points',()=>{
  const s=rich();L.exchangeHeritage(s,10);L.developTrait(s,'armor');L.learn(s,'metabolism');L.allocate(s,'agility');L.advance(s,200);
  const next=L.restart(s,4);assert.equal(next.heritage.points,10);assert.equal(next.heritage.pending,0);
  assert.equal(next.heritage.generation,1);assert.equal(next.energy,0);assert.equal(next.points,5);assert.equal(next.age,0);
  assert.equal(L.count(next),1);assert.equal(L.progress(next),1);assert.equal(next.attrs.agility,0);
  assert.equal(next.skills.metabolism,0);assert.equal(next.traits.armor,0);assert.equal(next.speed,1);
  assert.equal(L.developGene(next,'power'),true);assert.equal(next.heritage.points,9);assert.equal(L.effectiveAttrs(next).power,1);
  const again=L.restart(next,5);assert.equal(again.heritage.points,9);assert.equal(again.heritage.genes.power,1);
  assert.equal(L.effectiveAttrs(again).power,1);assert.equal(L.geneCost(again,'power'),2);assert.ok(L.valid(again));
  assert.equal(L.restart(again).heritage.points,9);
});
test('v3 saves gain cultivation defaults without losing current progress, skills, or energy',()=>{
  const s=rich();L.setSpeed(s,10);L.advance(s,700);const old=structuredClone(s);old.version=3;delete old.traits;delete old.heritage;
  const restored=L.migrate(old);assert.equal(restored.version,4);assert.equal(restored.energy,s.energy);
  assert.deepEqual(restored.lineage,s.lineage);assert.deepEqual(restored.skills,s.skills);
  assert.equal(restored.heritage.points,0);assert.equal(restored.traits.nightvision,0);assert.ok(L.valid(restored));
});
test('cultivation saves reject corrupt levels, negative balances and inconsistent gene accounting',()=>{
  const s=L.create();
  for(const alter of [x=>x.traits.armor=13,x=>x.heritage.points=-1,x=>x.heritage.pending=1,x=>x.heritage.genes.power=1,x=>delete x.heritage,x=>x.heritage.converted=Infinity]){
    const bad=structuredClone(s);alter(bad);assert.equal(L.valid(bad),false);
  }
  assert.throws(()=>L.migrate({...s,heritage:null}));
});
test('traits and inherited genes affect energy and evolution identically online and offline',()=>{
  const parent=rich();L.exchangeHeritage(parent,10);const a=L.restart(parent,42);
  L.developGene(a,'agility');L.developGene(a,'power');a.energy=a.total=1e9;L.developTrait(a,'nightvision');L.developTrait(a,'coldproof');
  const b=structuredClone(a);L.advance(a,1200);for(let i=0;i<1200;i++)L.advance(b,1);
  assert.deepEqual(a,b);assert.ok(L.rate(a)>L.rate(L.create()));assert.ok(L.evolutionRate(a)>1);assert.ok(L.valid(a));
});

