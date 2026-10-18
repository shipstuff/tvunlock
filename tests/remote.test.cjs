'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function sandbox() {
  let writes=0;
  const context=vm.createContext({
    require(name) {
      if(name==='fs')return {unlinkSync(){writes++;}};
      if(name==='child_process')return {execFileSync(){writes++;}};
      return require(name);
    },
    Buffer,process:{argv:['node','-','unused']},setTimeout,clearTimeout,
  });
  const source=fs.readFileSync(path.join(__dirname,'../tools/remote.cjs'),'utf8');
  vm.runInContext(source.split('(async()=>{')[0],context);
  vm.runInContext(`
    system=async()=>({modelName:'TEST_MODEL',firmwareVersion:'TEST_FIRMWARE'});
    inventory=async()=>[{id:'example.optional',removable:true},{id:'airplay',removable:true}];
    demos=()=>[{path:'/mnt/lg/appstore/preload/storedemo/example.lge',size:100}];
    luna=async(uri)=>{
      if(uri.endsWith('/getSystemSettings'))return {settings:{homePromotion:'off'}};
      throw new Error('Unexpected write or API call: '+uri);
    };
    globalThis.applyPlan=apply;
  `,context);
  return {apply:context.applyPlan,writes:()=>writes};
}
const base=()=>({schema:1,system:{modelName:'TEST_MODEL',firmwareVersion:'TEST_FIRMWARE'},removeApps:[],disableSettings:[],deleteDemoFiles:[]});
test('remote rejects protected casting app even if a plan is hand edited',async()=>{
  const s=sandbox(),p=base();p.removeApps=[{id:'airplay'}];
  await assert.rejects(s.apply(p),/protected/);assert.equal(s.writes(),0);
});
test('remote rejects an outdated platform before changing anything',async()=>{
  const s=sandbox(),p=base();p.system.firmwareVersion='OLDER';
  await assert.rejects(s.apply(p),/version differs/);assert.equal(s.writes(),0);
});
test('remote validates settings before any approved app removal',async()=>{
  const s=sandbox(),p=base();p.removeApps=[{id:'example.optional'}];
  p.disableSettings=[{category:'general',key:'homePromotion',before:'on',after:'off'}];
  await assert.rejects(s.apply(p),/changed after planning/);assert.equal(s.writes(),0);
});
test('remote rejects files outside audited retail media',async()=>{
  const s=sandbox(),p=base();p.deleteDemoFiles=[{path:'/unrelated/file',size:100}];
  await assert.rejects(s.apply(p),/not approved retail media/);assert.equal(s.writes(),0);
});
test('remote rejects changed demo media before app removal',async()=>{
  const s=sandbox(),p=base();p.removeApps=[{id:'example.optional'}];
  p.deleteDemoFiles=[{path:'/mnt/lg/appstore/preload/storedemo/example.lge',size:200}];
  await assert.rejects(s.apply(p),/changed/);assert.equal(s.writes(),0);
});
