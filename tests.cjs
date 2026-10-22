const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('./engine.js');
test('zero input unlocks life and purchases upgrades', () => {
  const s = L.create(); L.advance(s, 120);
  assert.equal(L.count(s), 3); assert.ok(s.level > 0); assert.ok(s.total > 120);
});
test('offline and online use the same simulation, including fractional ticks', () => {
  const a = L.create(), b = structuredClone(a);
  L.advance(a, 3600);
  for (let i = 0; i < 14400; i++) L.advance(b, .25);
  assert.deepEqual(a, b); assert.ok(L.progress(a) > 3);
});
test('pause stops progress and long absences are capped at eight hours', () => {
  const s = L.create(); s.paused = true; L.advance(s, 100); assert.equal(s.age, 0);
  s.paused = false; L.advance(s, 1e8); assert.equal(s.age, 28800);
});
test('save validation rejects corrupt, negative, and impossible values', () => {
  const s = L.create(); assert.ok(L.valid(s));
  for (const patch of [{age:-1}, {level:51}, {fraction:1}, {total:Infinity}, {energy:2}, {version:4}, {paused:'yes'}, {attrs:{power:-1}}, {found:[{id:'missing',age:0}]}, {points:-1}, {buffs:[{label:'bad',energy:1e99}]}]) assert.equal(L.valid({...s,...patch}), false);
});
test('340 unique life forms remain available for the full collection preview',()=>{
  assert.equal(L.species.length,340);assert.equal(new Set(L.species.map(s=>s.id)).size,340);assert.equal(new Set(L.species.map(s=>s.name)).size,340);
  for(let g=0;g<17;g++)assert.equal(L.species.filter(s=>s.group===g).length,20);
});

test('manual attributes spend points, change the next species and route order', () => {
  const a=L.create(),b=L.create();
  assert.equal(L.allocate(a,'power'),true);assert.equal(L.allocate(b,'agility'),true);
  assert.equal(a.points,4);
  assert.notDeepEqual(L.route(a).groups,L.route(b).groups);
  assert.ok(L.rate(a)>L.rate(L.create()));assert.ok(L.evolutionRate(b)>1);
  a.points=0;assert.equal(L.allocate(a,'power'),false);assert.equal(L.allocate(a,'fake'),false);
});
test('different world event choices apply real permanent stats and temporary gains/losses', () => {
  const a=L.create(1),b=structuredClone(a);L.advance(a,a.nextEvent);L.advance(b,b.nextEvent);
  assert.ok(a.pending);assert.equal(L.choose(a,0),true);assert.equal(L.choose(b,1),true);
  assert.equal(a.attrs.power,3);assert.equal(b.attrs.adaptation,3);
  assert.ok(L.modifier(a,'energy')>1);assert.ok(L.modifier(b,'energy')<1);
  assert.ok(L.evolutionRate(a)<1);assert.notEqual(L.route(a).key,L.route(b).key);
  assert.equal(L.choose(a,1),false);
  L.advance(a,180);assert.equal(a.buffs.length,0);assert.equal(a.attrs.power,3);
});
test('events wait indefinitely without blocking evolution and pause still freezes simulation', () => {
  const s=L.create(1);L.advance(s,s.nextEvent);const arrived=s.age,pending=structuredClone(s.pending);
  assert.equal(s.pending.deadline,undefined);
  s.paused=true;L.advance(s,120);assert.equal(s.age,arrived);assert.ok(s.pending);
  s.paused=false;const before=L.count(s);L.advance(s,3600);
  assert.deepEqual(s.pending,pending);assert.equal(s.eventLog.length,0);assert.equal(s.attrs.adaptation,0);
  assert.ok(L.count(s)>before);assert.ok(L.valid(s));
  L.choose(s,0);assert.equal(s.pending,null);assert.ok(s.nextEvent>=s.age+90&&s.nextEvent<=s.age+360);
});
test('event times and types vary, with the random schedule preserved across saves', () => {
  const s=L.create(12345),intervals=new Set(),types=new Set();
  for(let i=0;i<20;i++){const wait=s.nextEvent-s.age;intervals.add(wait);L.advance(s,wait);types.add(s.pending.index);L.choose(s,i%2);}
  assert.ok(intervals.size>10);assert.ok(types.size>4);
  const restored=L.migrate(s);L.advance(s,500);L.advance(restored,500);assert.deepEqual(s,restored);
});
test('rerouting never removes or duplicates previously found life', () => {
  const s=L.create();L.advance(s,500);const found=s.found.map(f=>f.id);
  for(let i=0;i<5;i++)L.allocate(s,'agility');L.advance(s,500);
  assert.ok(found.every(id=>L.has(s,id)));assert.equal(new Set(s.found.map(f=>f.id)).size,s.found.length);
});
test('old saves migrate without losing age, energy, or upgrade levels', () => {
  const old={version:1,age:500,fraction:.25,energy:25,total:500,level:4,paused:false,savedAt:Date.now()};
  const s=L.migrate(old);assert.equal(s.version,3);assert.equal(s.energy,25);assert.equal(s.age,500);assert.equal(s.level,4);
  assert.ok(s.points>=5);assert.ok(L.valid(s));assert.deepEqual(L.migrate(s),s);
});
test('speed scales only evolution, preserves real-time events and production, and migrates', () => {
  const a=L.create(),b=structuredClone(a);L.setSpeed(b,10);
  L.advance(a,29);L.advance(b,29);
  assert.ok(Math.abs(b.evolution-a.evolution*10)<1e-8);
  assert.equal(a.age,b.age);assert.equal(a.pending,null);assert.equal(b.pending,null);
  const c=L.create();assert.equal(L.rate(c),L.rate({...c,speed:10}));
  assert.equal(L.setSpeed(c,99),false);assert.equal(c.speed,1);
  const wait=a.nextEvent-a.age;L.advance(a,wait);L.advance(b,wait);assert.deepEqual(a.pending,b.pending);
  delete c.speed;assert.equal(L.migrate(c).speed,1);assert.ok(L.valid(b));
});
test('all six attributes have distinct routes and actual production or research effects', () => {
  assert.equal(L.attributes.length,6);const routes=new Set();
  for(const attr of L.attributes){const s=L.create();assert.ok(L.allocate(s,attr.key));routes.add(L.route(s).key);}
  assert.equal(routes.size,6);
  const base=L.create();for(const key of ['power','adaptation','perception','fertility']){const s=structuredClone(base);L.allocate(s,key);assert.ok(L.rate(s)>L.rate(base));}
  const wise=structuredClone(base);L.allocate(wise,'intelligence');assert.ok(L.skillCost(wise,'metabolism')<L.skillCost(base,'metabolism'));
});
test('skills consume life energy and permanently raise production, with level and balance limits', () => {
  for(const skill of L.skills){const s=L.create();s.energy=s.total=1e12;const before=L.rate(s),price=L.skillCost(s,skill.key);
    assert.ok(L.learn(s,skill.key));assert.equal(s.energy,1e12-price);assert.ok(L.rate(s)>before);assert.equal(L.skillLevel(s,skill.key),1);
    for(let i=1;i<12;i++)assert.ok(L.learn(s,skill.key));assert.equal(L.learn(s,skill.key),false);assert.ok(L.valid(s));
  }
  const empty=L.create();assert.equal(L.learn(empty,'metabolism'),false);assert.equal(L.learn(empty,'missing'),false);
});
test('skills and six-dimensional attributes survive offline simulation and three-stat save migration', () => {
  const old=L.create();delete old.attrs.perception;delete old.attrs.intelligence;delete old.attrs.fertility;delete old.skills;
  const migrated=L.migrate(old);assert.equal(migrated.attrs.intelligence,0);assert.equal(migrated.skills.metabolism,0);assert.ok(L.valid(migrated));
  const a=L.create();a.energy=a.total=10000;L.learn(a,'metabolism');L.learn(a,'foraging');const b=structuredClone(a);
  L.advance(a,1200);for(let i=0;i<1200;i++)L.advance(b,1);assert.deepEqual(a,b);assert.ok(L.valid(a));
});

require('./lineage.test.cjs');


