'use strict';
// Sent over an existing, owner-authorized SSH connection; never opens a network port.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const action = process.argv[2];
const payload = JSON.parse(Buffer.from(process.argv[3] || 'e30=', 'base64').toString());
const protectedApps = new Set(['airplay','com.webos.app.home','com.webos.app.browser',
  'com.webos.app.miracast','com.webos.chromecast','org.webosbrew.hbchannel',
  'org.webosbrew.inputhook','works.partridge.webos-launcher','local.tvrefresh.lghome']);
const adKeys = {general:['homePromotion','screenSaverAd'],other:['contentRecommendation'],option:['livePromotion','livePlus']};
const demoDir = '/mnt/lg/appstore/preload/storedemo';

function luna(uri, params={}, terminal=null) {
  return new Promise((resolve,reject)=>{
    const proc=cp.spawn('/usr/bin/luna-send',terminal?['-i',uri,JSON.stringify(params)]:['-n','1',uri,JSON.stringify(params)],{stdio:['pipe','pipe','pipe']});
    let buffer='', failure='', result, done=false;
    const timeout=setTimeout(()=>{failure='Luna timeout: '+uri;proc.kill('SIGTERM');},30000);
    proc.stdout.on('data',data=>{
      buffer+=data;
      let end;
      while((end=buffer.indexOf('\n'))!==-1) {
        const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);
        if(!line)continue;
        try {
          const message=JSON.parse(line);
          if(terminal && (message.returnValue===false || message.details?.state==='failed' || message.details?.errorCode)) {
            failure=JSON.stringify(message);proc.stdin.end();proc.kill('SIGTERM');
          } else if(!terminal || terminal(message)) {result=message;done=true;proc.stdin.end();}
        } catch(err){failure='Invalid Luna response: '+err.message;proc.kill('SIGTERM');}
      }
    });
    proc.stderr.on('data',data=>{failure+=data;});
    proc.on('error',err=>{clearTimeout(timeout);reject(err);});
    proc.on('close',()=>{clearTimeout(timeout);if(done)resolve(result);else reject(new Error(failure||'No Luna response: '+uri));});
  });
}
function demos() {
  let names;
  try {if(fs.realpathSync(demoDir)!==demoDir)return []; names=fs.readdirSync(demoDir);} catch(_){return [];}
  return names.filter(name=>name.endsWith('.lge') && path.basename(name)===name).flatMap(name=>{
    const file=path.join(demoDir,name), stat=fs.lstatSync(file);
    return stat.isFile()&&!stat.isSymbolicLink()?[{path:file,size:stat.size,allocatedBytes:stat.blocks*512}]:[];
  });
}
async function inventory() {
  const response=await luna('luna://com.webos.applicationManager/listApps');
  if(response.returnValue===false || !Array.isArray(response.apps))throw new Error('App inventory unavailable; no changes permitted.');
  return response.apps;
}
async function system() {
  const r=await luna('luna://com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','sdkVersion','firmwareVersion']});
  if(r.returnValue===false)throw new Error('System version query failed.');
  const result={};for(const key of ['modelName','sdkVersion','firmwareVersion'])if(r[key])result[key]=r[key];
  return result;
}
async function audit() {
  const apps=await inventory(), settings={};
  for(const [category,keys] of Object.entries(adKeys)) {
    const response=await luna('luna://com.webos.settingsservice/getSystemSettings',{category,keys});
    settings[category]=response.settings||{};
  }
  const cleaned=apps.map(app=>{
    let sizeKiB=0;
    if(app.removable && typeof app.folderPath==='string' && /^\/(media|usr|mnt)\//.test(app.folderPath)) {
      try {sizeKiB=parseInt(cp.execFileSync('/usr/bin/du',['-sk',app.folderPath],{encoding:'utf8',timeout:10000}).split(/\s/)[0],10)||0;}catch(_){}
    }
    return {id:app.id,title:app.title||app.id,removable:app.removable===true,sizeKiB};
  });
  return {system:await system(),apps:cleaned,settings,demoFiles:demos(),
    storage:cp.execFileSync('/bin/df',['-Pk','/mnt/lg/appstore','/var'],{encoding:'utf8'})};
}
async function apply(plan) {
  if(plan.schema!==1)throw new Error('Unsupported plan schema.');
  const current=await system();
  if(!Object.keys(current).length || JSON.stringify(current)!==JSON.stringify(plan.system))throw new Error('TV version differs from the audit; create a new plan.');
  const installed=new Map((await inventory()).map(app=>[app.id,app]));
  const knownDemos=new Map(demos().map(file=>[file.path,file]));
  for(const app of plan.removeApps||[]) {
    if(protectedApps.has(app.id) || installed.get(app.id)?.removable!==true)throw new Error('Refusing protected/non-removable/absent app: '+app.id);
  }
  for(const setting of plan.disableSettings||[]) {
    if(!adKeys[setting.category]?.includes(setting.key)||setting.after!=='off')throw new Error('Unsupported setting change.');
    const r=await luna('luna://com.webos.settingsservice/getSystemSettings',{category:setting.category,keys:[setting.key]});
    if(r.settings?.[setting.key]!==setting.before)throw new Error('Setting changed after planning: '+setting.key);
  }
  for(const file of plan.deleteDemoFiles||[]) {
    const candidate=knownDemos.get(file.path);
    if(!candidate || candidate.size!==file.size)throw new Error('Demo file changed or is not approved retail media.');
  }
  // Validate the complete plan before performing the first write.
  const result={removedApps:[],deletedDemoFiles:[],disabledSettings:[]};
  for(const app of plan.removeApps||[]) {
    await luna('luna://com.webos.appInstallService/remove',{id:app.id,subscribe:true},r=>r.details?.state==='removed');
    result.removedApps.push(app.id);
  }
  for(const setting of plan.disableSettings||[]) {
    const r=await luna('luna://com.webos.settingsservice/setSystemSettings',{category:setting.category,settings:{[setting.key]:'off'}});
    if(r.returnValue!==true)throw new Error('Failed setting '+setting.key);
    result.disabledSettings.push(setting.key);
  }
  for(const file of plan.deleteDemoFiles||[]) {fs.unlinkSync(file.path);result.deletedDemoFiles.push(file.path);}
  const remaining=new Set((await inventory()).map(app=>app.id));
  if(result.removedApps.some(id=>remaining.has(id)))throw new Error('An app remains installed after removal.');
  for(const setting of plan.disableSettings||[]) {
    const r=await luna('luna://com.webos.settingsservice/getSystemSettings',{category:setting.category,keys:[setting.key]});
    if(r.settings?.[setting.key]!=='off')throw new Error('Setting verification failed: '+setting.key);
  }
  cp.execFileSync('/bin/sync');
  return result;
}
const homeDir='/var/lib/webosbrew/tvrefresh-home';
const bindPath='/home/root/.config/lginputhook/keybinds.json';
const originalPath=homeDir+'/original-home-state.json';
function readJson(file,fallback) {try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch(err){if(err.code==='ENOENT')return fallback;throw err;}}
async function homeState() {
  const apps=new Set((await inventory()).map(app=>app.id));
  if(!apps.has('org.webosbrew.hbchannel') || !apps.has('org.webosbrew.inputhook'))throw new Error('Install and verify Homebrew Channel and compatible LG Input Hook first.');
  const root=await luna('luna://org.webosbrew.hbchannel.service/checkRoot');
  if(root.returnValue!==true)throw new Error('Homebrew Channel is not elevated.');
  const shortcut=await luna('luna://com.webos.settingsservice/getSystemSettings',{category:'option',keys:['magicNum1']});
  if(shortcut.returnValue!==true)throw new Error('Cannot back up Quick Access; no changes permitted.');
  return {bindings:readJson(bindPath,{}),magicNum1:shortcut.settings.magicNum1||null,
    inputHookStartup:fs.existsSync('/var/lib/webosbrew/init.d/inputhook')};
}
function stopRouter() {
  try {
    const pid=Number(fs.readFileSync('/tmp/tvrefresh-home-router.pid','utf8'));
    if(Number.isInteger(pid)&&pid>1&&fs.readFileSync('/proc/'+pid+'/cmdline','utf8').includes(homeDir+'/router.cjs'))process.kill(pid,'SIGTERM');
  }catch(err){if(!['ENOENT','ESRCH'].includes(err.code))throw err;}
}
async function configureHome() {
  const before=await homeState();
  fs.mkdirSync(homeDir,{recursive:true});
  if(!fs.existsSync(originalPath))fs.writeFileSync(originalPath,JSON.stringify(before,null,2),{mode:0o600});
  const apps=new Set((await inventory()).map(app=>app.id));
  for(const id of ['works.partridge.webos-launcher','local.tvrefresh.lghome'])if(!apps.has(id))throw new Error('Missing home package: '+id);
  cp.execFileSync('/media/developer/apps/usr/palm/services/org.webosbrew.hbchannel.service/elevate-service',['org.webosbrew.inputhook.service'],{timeout:20000,stdio:'pipe'});
  const start=await luna('luna://org.webosbrew.inputhook.service/start');
  if(start.returnValue!==true)throw new Error('Input Hook failed to start.');
  const bindings=readJson(bindPath,{});
  bindings['773']={action:'launch',id:'works.partridge.webos-launcher'};
  fs.mkdirSync(path.dirname(bindPath),{recursive:true});
  fs.writeFileSync(bindPath,JSON.stringify(bindings,null,2));
  const setting=await luna('luna://com.webos.settingsservice/setSystemSettings',{category:'option',settings:{magicNum1:{id:'local.tvrefresh.lghome',params:{}}}});
  if(setting.returnValue!==true)throw new Error('Quick Access assignment failed.');
  const boot=await luna('luna://org.webosbrew.inputhook.service/autostart');
  if(boot.returnValue!==true)throw new Error('Input Hook startup registration failed.');
  fs.chmodSync(homeDir+'/start.sh',0o755);
  fs.mkdirSync('/var/lib/webosbrew/init.d',{recursive:true});
  fs.copyFileSync(homeDir+'/start.sh','/var/lib/webosbrew/init.d/tvrefresh-home');
  fs.chmodSync('/var/lib/webosbrew/init.d/tvrefresh-home',0o755);
  stopRouter();
  // Let the old process release its PID file before starting its replacement.
  await new Promise(resolve=>setTimeout(resolve,500));
  cp.execFileSync('/bin/sh',[homeDir+'/start.sh'],{stdio:'ignore',timeout:5000});
  return {configured:true,homeKey:'773',quickAccess:'hold 1',routerLog:'/tmp/tvrefresh-home-router.log'};
}
async function restoreHome() {
  const original=readJson(originalPath,null);
  if(!original)throw new Error('No original-home baseline exists; inspect the TV manually.');
  stopRouter();
  fs.rmSync('/var/lib/webosbrew/init.d/tvrefresh-home',{force:true});
  const bindings=readJson(bindPath,{});
  if(Object.prototype.hasOwnProperty.call(original.bindings,'773'))bindings['773']=original.bindings['773'];
  else delete bindings['773'];
  fs.writeFileSync(bindPath,JSON.stringify(bindings,null,2));
  if(!original.inputHookStartup)fs.rmSync('/var/lib/webosbrew/init.d/inputhook',{force:true});
  const shortcut=original.magicNum1
    ?await luna('luna://com.webos.settingsservice/setSystemSettings',{category:'option',settings:{magicNum1:original.magicNum1}})
    :await luna('luna://com.webos.settingsservice/resetSystemSettings',{category:'option',keys:['magicNum1']});
  if(shortcut.returnValue!==true)throw new Error('Quick Access restore failed.');
  return {restored:true,rootUnchanged:true,packagesRetained:true};
}
(async()=>{
  if(process.getuid()!==0)throw new Error('This tool requires existing, owner-authorized root SSH. It does not root TVs.');
  let result;
  if(action==='audit')result=await audit();
  else if(action==='apply')result=await apply(payload);
  else if(action==='homeState')result=await homeState();
  else if(action==='prepareHomeDirectory') {fs.mkdirSync(homeDir,{recursive:true});result={ready:true};}
  else if(action==='installHomePackage') {
    const packages={launcher:['/tmp/tvunlock-launcher.ipk','works.partridge.webos-launcher'],shortcut:['/tmp/tvunlock-lg-home.ipk','local.tvrefresh.lghome']};
    const pkg=packages[payload.kind];if(!pkg)throw new Error('Unsupported package kind.');
    const response=await luna('luna://com.webos.appInstallService/dev/install',{id:'com.ares.defaultName',ipkUrl:pkg[0],subscribe:true},r=>r.details?.state==='installed');
    if(response.details.packageId!==pkg[1])throw new Error('Unexpected installed package; stop and inspect.');
    result={installed:pkg[1]};
  }
  else if(action==='configureHome')result=await configureHome();
  else if(action==='restoreHome')result=await restoreHome();
  else throw new Error('Unsupported action.');
  console.log(JSON.stringify(result));
})().catch(err=>{console.error(err.message);process.exitCode=1;});
