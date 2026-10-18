// Example of a local catalogue override. Copy to catalog.local.ts (git-ignored) and edit.
// Both exports are optional. Rebuild after changing it.
//
// Find an app's ID with `ares-launch --device <tv> --listApp`, or on a rooted TV:
//   luna-send -n 1 luna://com.webos.applicationManager/listLaunchPoints '{}'

import type {CatalogApp} from './catalog';

/** Added to the catalogue; an entry with an existing id replaces it. For an icon, put a
 *  PNG in public/icons/apps/ and name it here, or omit `icon` for a monogram tile. */
export const EXTRA_APPS: CatalogApp[] = [
	{id: 'com.example.myapp', title: 'My App', color: '#444444'}
];

/** Replaces the default Apps row for a fresh install (before anything is edited in Settings). */
export const DEFAULT_APP_IDS: string[] = [
	'youtube.leanback.v4', 'netflix', 'com.example.myapp'
];
