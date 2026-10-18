// Catalogue of apps the launcher knows how to show without any privileged access.
//
// A sideloaded web app on webOS 6 is not allowed to list installed apps, and it
// cannot read other apps' icon files, so we ship our own list and icon copies
// (public/icons/apps/<id>.png). At runtime the catalogue is filtered with
// applicationManager/getAppLoadStatus, which *is* permitted, so only apps that
// actually exist on the TV are offered. Entries without an icon fall back to a
// monogram tile in their brand colour.
//
// The list is deliberately broad and international: an entry for an app a TV
// doesn't have costs nothing. To add apps, change the defaults, or both, without
// editing this file, create src/config/catalog.local.ts (git-ignored); see
// catalog.local.example.ts.

export interface CatalogApp {
	id: string;
	title: string;
	/** file name under icons/apps/ (omit for a monogram tile) */
	icon?: string;
	/** monogram background when there is no icon */
	color?: string;
}

/** Shape of the optional src/config/catalog.local.ts. */
export interface LocalCatalog {
	/** extra apps, or replacements for entries with the same id */
	EXTRA_APPS?: CatalogApp[];
	/** replaces DEFAULT_APP_IDS */
	DEFAULT_APP_IDS?: string[];
}

const BASE_CATALOG: CatalogApp[] = [
	// Global streaming
	{id: 'youtube.leanback.v4', title: 'YouTube', icon: 'youtube.leanback.v4.png'},
	{id: 'netflix', title: 'Netflix', icon: 'netflix.svg'},
	{id: 'amazon', title: 'Prime Video', icon: 'amazon.png'},
	{id: 'com.disney.disneyplus-prod', title: 'Disney+', icon: 'disney-plus.svg'},
	{id: 'com.apple.appletv', title: 'Apple TV', icon: 'com.apple.appletv.png'},
	{id: 'com.wbd.stream', title: 'Max', color: '#002be7'},
	{id: 'cdp-30', title: 'Plex', icon: 'cdp-30.png'},
	{id: 'spotify-beehive', title: 'Spotify', icon: 'spotify.svg'},
	{id: 'tv.twitch.tv.starshot.lg', title: 'Twitch', icon: 'tv.twitch.tv.starshot.lg.png'},
	// North America
	{id: 'hulu', title: 'Hulu', icon: 'hulu.svg'},
	{id: 'com.peacock.tv', title: 'Peacock', icon: 'peacock.svg'},
	{id: 'youtube.leanback.ytv.v1', title: 'YouTube TV', color: '#cc0000'},
	{id: 'com.plutotv.app', title: 'Pluto TV', color: '#2b2b2b'},
	{id: 'com.tubitv.ott.tubi', title: 'Tubi', color: '#7408ff'},
	{id: 'com.espn.espnplus-prod', title: 'ESPN', color: '#c8102e'},
	{id: 'vudu', title: 'Fandango at Home', color: '#3399ff'},
	// UK
	{id: 'bbc.iplayer.3.0', title: 'BBC iPlayer', icon: 'bbc.iplayer.3.0.png'},
	{id: 'bbc.sounds.1.0', title: 'BBC Sounds', icon: 'bbc.sounds.1.0.png'},
	{id: 'com.fvp.itv', title: 'ITVX', icon: 'com.fvp.itv.png'},
	{id: 'com.fvp.ch4', title: 'Channel 4', icon: 'com.fvp.ch4.png'},
	{id: 'demand5', title: 'Channel 5', icon: 'demand5.png'},
	{id: 'com.fvp.uktv', title: 'UKTV Play', icon: 'com.fvp.uktv.png'},
	{id: 'now.tv', title: 'NOW', icon: 'now.tv.png'},
	// LG built-ins
	{id: 'com.webos.app.browser', title: 'Browser', icon: 'com.webos.app.browser.png'},
	{id: 'com.webos.app.mediadiscovery', title: 'Media Player', icon: 'com.webos.app.mediadiscovery.png'},
	{id: 'com.webos.app.igallery', title: 'Art Gallery', icon: 'com.webos.app.igallery.png'},
	{id: 'com.webos.app.homeconnect', title: 'Home Dashboard', icon: 'com.webos.app.homeconnect.png'},
	{id: 'amazon.alexa.view', title: 'Alexa', icon: 'amazon.alexa.view.png'},
	{id: 'com.palm.app.settings', title: 'LG Settings', color: '#2f3339'},
	// webOS Homebrew
	{id: 'org.webosbrew.hbchannel', title: 'Homebrew', icon: 'org.webosbrew.hbchannel.png'},
	{id: 'org.webosbrew.inputhook', title: 'Input Hook', icon: 'org.webosbrew.inputhook.png'},
	{id: 'org.webosbrew.safeupdate', title: 'HB Updater', icon: 'org.webosbrew.safeupdate.png'},
	{id: 'com.lennylxx.iptv', title: 'IPTV Player', icon: 'com.lennylxx.iptv.png'},
	{id: 'org.jellyfin.webos', title: 'Jellyfin', color: '#00a4dc'}
];

/** Apps shown on a fresh install, in row order. Anything not installed is skipped. */
const BASE_DEFAULT_APP_IDS: string[] = [
	'youtube.leanback.v4', 'netflix', 'amazon', 'com.disney.disneyplus-prod',
	'com.apple.appletv', 'com.wbd.stream', 'cdp-30', 'spotify-beehive', 'hulu', 'com.peacock.tv'
];

// Vite resolves this at build time; it's an empty object when the file doesn't exist.
const localModules = import.meta.glob<LocalCatalog>('./catalog.local.ts', {eager: true});
const local: LocalCatalog = localModules['./catalog.local.ts'] || {};

function mergeCatalog (base: CatalogApp[], extra: CatalogApp[]): CatalogApp[] {
	const extraIds = extra.map((a) => a.id);
	return base.filter((a) => extraIds.indexOf(a.id) === -1).concat(extra);
}

export const APP_CATALOG: CatalogApp[] = mergeCatalog(BASE_CATALOG, local.EXTRA_APPS || []);
export const DEFAULT_APP_IDS: string[] = local.DEFAULT_APP_IDS || BASE_DEFAULT_APP_IDS;
