// Available apps. Two providers:
//
//  1. Catalogue (default, no root): config/catalog.ts filtered by getAppLoadStatus.
//  2. Homebrew Channel (opt-in, rooted TVs only): the Homebrew Channel's service runs
//     shell commands as root for any app that asks. With the user's consent (an option
//     in Settings, off by default) we use it to run `luna-send listLaunchPoints`, which
//     gives the live list with LG's own titles, and to read each icon as base64. If the
//     service isn't there, we fall back to the catalogue.

import {APP_CATALOG, type CatalogApp} from '../config/catalog';
import {APP_ID, LUNA} from '../config/constants';
import {isWebOS, lunaCall, type LunaResponse} from './luna';
import {appExists} from './launch';

export interface AppEntry {
	id: string;
	title: string;
	/** image URL (relative asset path or data: URI); undefined → monogram */
	iconUrl?: string;
	color?: string;
}

export type AppSource = 'catalog' | 'homebrew';

export interface AppList {
	apps: AppEntry[];
	/** where the list actually came from (homebrew falls back to catalog) */
	source: AppSource;
}

const ICON_DIR = 'icons/apps/';

export function listApps (useHomebrew: boolean): Promise<AppList> {
	if (!isWebOS()) return Promise.resolve({apps: catalogEntries(APP_CATALOG), source: 'catalog'});
	const catalog = () => listViaCatalog().then((apps): AppList => ({apps, source: 'catalog'}));
	if (!useHomebrew) return catalog();
	return listViaHomebrew()
		.then((apps): AppList => ({apps, source: 'homebrew'}))
		.catch(catalog);
}

// ---------- provider 1: catalogue ----------

function catalogEntries (apps: CatalogApp[]): AppEntry[] {
	return apps.map((a) => ({
		id: a.id,
		title: a.title,
		iconUrl: a.icon ? ICON_DIR + a.icon : undefined,
		color: a.color
	}));
}

function listViaCatalog (): Promise<AppEntry[]> {
	return Promise.all(APP_CATALOG.map((a) => appExists(a.id)))
		.then((present) => catalogEntries(APP_CATALOG.filter((_, i) => present[i])));
}

// ---------- provider 2: Homebrew Channel (opt-in) ----------

interface ExecResponse extends LunaResponse { stdoutString?: string; }
interface LaunchPoint { id: string; title: string; largeIcon?: string; icon?: string; }

/** Apps LG lists but that make no sense on a launcher (ourselves, promos). */
const HIDDEN_IDS = [APP_ID, 'google.assistant.promo', 'com.webos.app.discovery'];

const ICON_CACHE_KEY = 'launcher-icon-cache-v1';

/** Icon paths must be plain absolute paths. Anything else (quotes, spaces, control
 *  characters, shell syntax) is skipped rather than passed to a root shell. */
const SAFE_PATH = /^\/[A-Za-z0-9._\/+@-]+$/;

/** Quote a value for a POSIX shell. Defence in depth: paths are also validated. */
export function shellQuote (value: string): string {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}

function exec (command: string, timeoutMs = 8000): Promise<string> {
	return lunaCall<ExecResponse>(LUNA.homebrewExec, {command}, timeoutMs).then((r) => r.stdoutString || '');
}

function listViaHomebrew (): Promise<AppEntry[]> {
	return exec("luna-send -n 1 luna://com.webos.applicationManager/listLaunchPoints '{}'")
		.then((out) => {
			const parsed = JSON.parse(out) as {launchPoints?: LaunchPoint[]};
			const points = (parsed.launchPoints || []).filter((p) => p.id && p.title && HIDDEN_IDS.indexOf(p.id) === -1);
			if (!points.length) throw new Error('no launch points');
			return loadIcons(points).then((icons) => points.map((p) => {
				const known = APP_CATALOG.find((c) => c.id === p.id);
				return {
					id: p.id,
					// the catalogue's titles are shorter than LG's ("IPTV Player" vs "webOS IPTV Player")
					title: known ? known.title : p.title,
					iconUrl: icons[p.id] || (known && known.icon ? ICON_DIR + known.icon : undefined),
					color: known && known.color
				};
			}));
		});
}

/** Read the icons as data URIs in one shell round-trip, cached in localStorage by path.
 *  Icons are requested by *index*, so app IDs never reach the shell. */
function loadIcons (points: LaunchPoint[]): Promise<Record<string, string>> {
	const cache = readIconCache();
	const result: Record<string, string> = {};
	const missing: {id: string; path: string}[] = [];
	for (const p of points) {
		const path = p.largeIcon || p.icon;
		if (!path || !SAFE_PATH.test(path)) continue;
		if (cache[path]) result[p.id] = cache[path];
		else missing.push({id: p.id, path});
	}
	if (!missing.length) return Promise.resolve(result);

	// One line per icon: "<index> <base64>". busybox base64 has no -w, so strip newlines.
	const script = missing
		.map((m, i) => `printf '%d ' ${i}; base64 ${shellQuote(m.path)} 2>/dev/null | tr -d '\\n'; echo`)
		.join('; ');
	return exec(script, 15000).then((out) => {
		for (const line of out.split('\n')) {
			const match = /^(\d+) ([A-Za-z0-9+\/=]+)$/.exec(line);
			const entry = match && missing[Number(match[1])];
			if (!match || !entry) continue;
			const url = `data:image/png;base64,${match[2]}`;
			result[entry.id] = url;
			cache[entry.path] = url;
		}
		writeIconCache(cache);
		return result;
	}).catch(() => result);
}

function readIconCache (): Record<string, string> {
	try { return JSON.parse(localStorage.getItem(ICON_CACHE_KEY) || '{}'); }
	catch { return {}; }
}

function writeIconCache (cache: Record<string, string>): void {
	try { localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(cache)); }
	catch { /* quota exceeded: icons will simply be re-fetched next time */ }
}
