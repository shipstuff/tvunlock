const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createRouter} = require('./core.cjs');
function setup() {
  let allowed = false, redirects = 0;
  const router = createRouter({consumePermission: () => { const value = allowed; allowed = false; return value; }, redirect: () => {redirects++; router.didRedirect();}});
  return {router, allow: () => {allowed = true;}, count: () => redirects};
}
test('startup routes LG Home only once the screen is active', () => {
  const s=setup(); s.router.onForeground('com.webos.app.home'); assert.equal(s.count(),0);
  s.router.onPower('Active'); assert.equal(s.count(),1);
});
test('AirPlay return routes home, without interrupting the cast', () => {
  const s=setup(); s.router.onPower('Active'); s.router.onForeground('airplay'); assert.equal(s.count(),0);
  s.router.onForeground('com.webos.app.home'); assert.equal(s.count(),1);
});
test('intentional LG Home remains available until another app opens', () => {
  const s=setup(); s.router.onPower('Active'); s.allow(); s.router.onForeground('com.webos.app.home');
  s.router.onForeground('com.webos.app.home'); assert.equal(s.count(),0);
  s.router.onForeground('airplay'); s.router.onForeground('com.webos.app.home'); assert.equal(s.count(),1);
});
test('screensaver wake preserves an intentional visit to LG Home', () => {
  const s=setup(); s.router.onPower('Active'); s.allow(); s.router.onForeground('com.webos.app.home');
  s.router.onPower('Screen Saver'); s.router.onPower('Active'); assert.equal(s.count(),0);
});
test('standby wake clears the intentional-home exception', () => {
  const s=setup(); s.router.onPower('Active'); s.allow(); s.router.onForeground('com.webos.app.home');
  s.router.onPower('Suspend'); s.router.onPower('Active'); assert.equal(s.count(),1);
});
test('pending home redirect is cancelled when a streaming app opens', () => {
  const s=setup(); s.router.onPower('Active'); s.router.onForeground('com.webos.app.home');
  s.router.onForeground('netflix'); assert.equal(s.router.shouldRedirect(),false);
});
test('cold startup replaces a restored HDMI input with Launcher', () => {
  const s=setup(); s.router.onForeground('com.webos.app.hdmi4'); s.router.onPower('Active'); assert.equal(s.count(),1);
});
test('power-on opens Launcher even when another app was restored', () => {
  const s=setup(); s.router.onPower('Active'); s.router.onForeground('works.partridge.webos-launcher');
  s.router.onPower('Suspend'); s.router.onForeground('netflix'); s.router.onPower('Active'); assert.equal(s.count(),1);
});
