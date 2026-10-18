// Writes build/<app-id>.manifest.json for the webOS Homebrew Channel repository.
//
//   node scripts/gen-manifest.mjs --repo <owner>/<name>
//
// In GitHub Actions the repo comes from GITHUB_REPOSITORY. The manifest is published
// as a release asset next to the .ipk, so `ipkUrl` is relative to it (the same layout
// the Homebrew Channel itself uses).
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {basename, join} from 'node:path';

const arg = (name) => {
	const i = process.argv.indexOf(`--${name}`);
	return i === -1 ? undefined : process.argv[i + 1];
};

const repo = arg('repo') || process.env.GITHUB_REPOSITORY;
if (!repo) {
	console.error('Missing --repo <owner>/<name> (or GITHUB_REPOSITORY)');
	process.exit(1);
}

const appinfo = JSON.parse(readFileSync('public/appinfo.json', 'utf8'));
const ipkName = readdirSync('build').find((f) => f.endsWith('.ipk'));
if (!ipkName) {
	console.error('No .ipk in build/ — run `npm run package` first');
	process.exit(1);
}
const expected = `${appinfo.id}_${appinfo.version}_all.ipk`;
if (ipkName !== expected) {
	console.error(`Expected ${expected} in build/, found ${ipkName}`);
	process.exit(1);
}

const ipkPath = join('build', ipkName);
const manifest = {
	id: appinfo.id,
	version: appinfo.version,
	type: appinfo.type,
	title: appinfo.title,
	appDescription: appinfo.appDescription,
	iconUri: `https://raw.githubusercontent.com/${repo}/main/public/largeIcon.png`,
	sourceUrl: `https://github.com/${repo}`,
	rootRequired: false,
	ipkUrl: basename(ipkPath),
	ipkHash: {sha256: createHash('sha256').update(readFileSync(ipkPath)).digest('hex')}
};

const out = join('build', `${appinfo.id}.manifest.json`);
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${out}`);
