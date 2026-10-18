// App-wide constants that are not visual tokens (see theme/tokens.ts for those).

export const APP_ID = 'works.partridge.webos-launcher';

/** webOS app IDs the launcher itself needs. */
export const SYSTEM_APP = {
	lgHome: 'local.tvrefresh.lghome',
	liveTv: 'com.webos.app.livetv',
	homebrewChannel: 'org.webosbrew.hbchannel'
} as const;

/** Luna service URIs. A sideloaded web app on webOS 6 may only call methods in the
 *  TV's "public" LS2 group; everything here except homebrewExec is in that group. */
export const LUNA = {
	launch: 'luna://com.webos.applicationManager/launch',
	appLoadStatus: 'luna://com.webos.applicationManager/getAppLoadStatus',
	inputStatus: 'luna://com.webos.service.eim/getAllInputStatus',
	preferences: 'luna://com.webos.service.systemservice/getPreferences',
	/** Homebrew Channel's root shell; only used when the user opts in (see lib/apps.ts) */
	homebrewExec: 'luna://org.webosbrew.hbchannel.service/exec'
} as const;

/** Remote-control key codes as delivered to a webOS web app. */
export const KEY = {
	left: 37, up: 38, right: 39, down: 40,
	enter: 13,
	back: 461,          // webOS "BACK" (needs disableBackHistoryAPI in appinfo.json)
	escape: 27          // handy when developing in a desktop browser
} as const;

export const TIMING = {
	lunaTimeoutMs: 4000,
	toastMs: 2200,
	clockTickMs: 1000,
	longPressMs: 600        // OK held this long enters/leaves re-order mode
} as const;

/** localStorage key for the user's selections. Bump the suffix on breaking changes. */
export const STORAGE_KEY = 'launcher-config-v1';
