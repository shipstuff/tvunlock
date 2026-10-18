'use strict';
const fs = require('fs');
const childProcess = require('child_process');
const {createRouter} = require('./core.cjs');
const marker = '/tmp/tvrefresh-allow-lg-home';
const children = new Set();
let stopping = false;
let redirectTimer;
let launching = false;
let lastLaunch = 0;
function log(message) { console.log(new Date().toISOString() + ' ' + message); }
function consumePermission() {
  try {
    const recent = Date.now() - fs.statSync(marker).mtimeMs < 8000;
    fs.unlinkSync(marker);
    return recent;
  } catch (_) { return false; }
}
function launch() {
  redirectTimer = undefined;
  if (!router.shouldRedirect() || launching) return;
  // Check once more immediately before launch to cover a shortcut racing the event.
  if (consumePermission()) { router.allowHome(); return; }
  launching = true;
  router.didRedirect();
  lastLaunch = Date.now();
  log('Opening custom launcher');
  const proc = childProcess.spawn('/usr/bin/luna-send', ['-n', '1', '-w', '5000',
    'luna://com.webos.applicationManager/launch', JSON.stringify({id:'works.partridge.webos-launcher'})], {stdio:['pipe','pipe','pipe']});
  children.add(proc);
  let output = '';
  proc.stdout.on('data', data => { output += data; });
  proc.stderr.on('data', data => { output += data; });
  const timeout = setTimeout(() => proc.kill('SIGTERM'), 6000);
  proc.on('error', err => log('Launch error: ' + err.message));
  proc.on('close', () => {
    children.delete(proc); launching = false; clearTimeout(timeout);
    log('Launch result: ' + output.trim());
  });
}
const router = createRouter({consumePermission, redirect() {
  if (!redirectTimer && !launching) redirectTimer = setTimeout(launch, Math.max(180, 1000 - (Date.now() - lastLaunch)));
}});
function subscribe(name, uri, callback) {
  let retry = 1000;
  function connect() {
    if (stopping) return;
    const proc = childProcess.spawn('/usr/bin/luna-send', ['-i', uri, '{"subscribe":true}'], {stdio:['pipe','pipe','pipe']});
    children.add(proc);
    let buffer = '';
    let errors = '';
    proc.stdout.on('data', chunk => {
      buffer += chunk.toString();
      let end;
      while ((end = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, end).trim(); buffer = buffer.slice(end + 1);
        if (!line) continue;
        try {
          const data = JSON.parse(line);
          if (data.returnValue === false) { log(name + ': ' + line); proc.kill('SIGTERM'); }
          else { retry = 1000; callback(data); }
        } catch (err) { log(name + ' parse error: ' + err.message); }
      }
    });
    proc.stderr.on('data', data => { errors = (errors + data).slice(-2000); });
    proc.on('error', err => { errors = err.message; });
    proc.on('close', () => {
      children.delete(proc);
      if (!stopping) { log(name + ' disconnected: ' + errors); setTimeout(connect, retry); retry = Math.min(30000, retry * 2); }
    });
  }
  connect();
}
let lastApp = '';
subscribe('foreground', 'luna://com.webos.applicationManager/getForegroundAppInfo', data => {
  if (data.appId && data.appId !== lastApp) {lastApp = data.appId; log('App: ' + data.appId);}
  router.onForeground(data.appId);
});
subscribe('power', 'luna://com.webos.service.tvpower/power/getPowerState', data => { log('Power: ' + data.state); router.onPower(data.state); });
function stop() {
  stopping = true;
  clearTimeout(redirectTimer);
  for (const proc of children) proc.kill('SIGTERM');
  try { fs.unlinkSync('/tmp/tvrefresh-home-router.pid'); } catch (_) {}
  process.exit(0);
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
fs.writeFileSync('/tmp/tvrefresh-home-router.pid', String(process.pid));
log('Home router started');
