'use strict';
const LG_HOME = 'com.webos.app.home';
const SHORTCUT = 'local.tvrefresh.lghome';
const LAUNCHER = 'works.partridge.webos-launcher';
const CAST_APPS = new Set(['airplay', 'com.webos.app.miracast', 'com.webos.chromecast']);
const STANDBY = new Set(['Suspend', 'Active Standby', 'Power Off', 'PowerOff']);

function createRouter({consumePermission, redirect}) {
  let foreground = '';
  let power = '';
  let intentionalHome = false;
  let pendingWake = true;
  function reconcile() {
    if (power !== 'Active' || !foreground) return;
    if (foreground === LAUNCHER) { pendingWake = false; return; }
    if (foreground === LG_HOME && consumePermission()) { intentionalHome = true; pendingWake = false; }
    if ((pendingWake && foreground !== SHORTCUT && !CAST_APPS.has(foreground)) ||
        (foreground === LG_HOME && !intentionalHome)) redirect();
  }
  return {
    allowHome() { intentionalHome = true; pendingWake = false; },
    didRedirect() { pendingWake = false; intentionalHome = false; },
    onForeground(appId) {
      if (!appId) return;
      foreground = appId;
      if (CAST_APPS.has(appId)) pendingWake = false;
      if (appId !== LG_HOME && appId !== SHORTCUT) intentionalHome = false;
      reconcile();
    },
    onPower(state) {
      if (!state) return;
      power = state;
      if (STANDBY.has(state)) pendingWake = true;
      if (state === 'Active' && pendingWake) intentionalHome = false;
      reconcile();
    },
    shouldRedirect() {
      return power === 'Active' && !!foreground && foreground !== LAUNCHER && foreground !== SHORTCUT &&
        ((pendingWake && !CAST_APPS.has(foreground)) || (foreground === LG_HOME && !intentionalHome));
    }
  };
}
module.exports = {createRouter};
