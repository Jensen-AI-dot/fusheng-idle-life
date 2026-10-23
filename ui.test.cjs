const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require.resolve('./index.html'),'utf8'),app=fs.readFileSync(require.resolve('./app.js'),'utf8');
function tabHarness(){
  const panes={},listeners={},tabs=['cultivate','skills','events','collection','heritage'].map(name=>({dataset:{tab:name},attrs:{},tabIndex:-1,parentElement:{addEventListener:(type,fn)=>listeners[type]=fn},setAttribute(key,value){this.attrs[key]=value;},focus(){this.focused=true;},closest(){return this;}}));
  tabs.forEach(t=>panes['pane-'+t.dataset.tab]={hidden:true});
  const context={$:id=>id==='tab-cultivate'?tabs[0]:panes[id],document:{querySelectorAll:()=>tabs}};vm.createContext(context);
  vm.runInContext(app.slice(app.indexOf('function selectTab('),app.indexOf('const KEY =')),context);
  return {tabs,panes,listeners,select:context.selectTab};
}
test('each game tab exposes exactly one matching panel and one keyboard stop',()=>{
  const h=tabHarness();for(const tab of h.tabs){h.select(tab.dataset.tab);assert.equal(h.tabs.filter(t=>t.tabIndex===0).length,1);assert.equal(h.tabs.filter(t=>t.attrs['aria-selected']==='true').length,1);assert.equal(Object.values(h.panes).filter(p=>!p.hidden).length,1);assert.equal(h.panes['pane-'+tab.dataset.tab].hidden,false);}
});
test('keyboard tab navigation wraps and supports Home and End',()=>{
  const h=tabHarness();const press=(i,key)=>{let prevented=false;h.listeners.keydown({target:h.tabs[i],key,preventDefault(){prevented=true;}});assert.ok(prevented);return h.tabs.findIndex(t=>t.tabIndex===0);};
  assert.equal(press(0,'ArrowLeft'),4);assert.equal(press(4,'ArrowRight'),0);assert.equal(press(2,'End'),4);assert.equal(press(4,'Home'),0);
  for(const t of h.tabs)assert.ok(t.focused||['skills','events','collection'].includes(t.dataset.tab));
});
test('pointer switching preserves the selected tab and reveals its content',()=>{
  const h=tabHarness();h.listeners.click({target:h.tabs[2]});assert.equal(h.panes['pane-events'].hidden,false);assert.equal(h.tabs[2].attrs['aria-selected'],'true');
});
test('compact layout retains unique controls and accessible tab relationships',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'No duplicated game control IDs');
  for(const name of ['cultivate','skills','events','collection','heritage']){assert.ok(ids.includes('tab-'+name));assert.ok(ids.includes('pane-'+name));assert.match(html,new RegExp('aria-controls="pane-'+name+'"'));}
  const declared=new Set([...ids,...[...app.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])]);
  for(const match of app.matchAll(/\$\('([^']+)'\)/g))assert.ok(declared.has(match[1]),'Missing control '+match[1]);
});

