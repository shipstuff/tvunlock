// Design tokens: the single source of truth for colour, spacing, type and motion.
// `applyTokens()` exposes them as CSS custom properties so the stylesheet and the
// components read the same values.

export const COLOR = {
	bg: '#000000',
	bgGradientInner: '#1e1e1e',
	bgGradientMid: '#0c0c0c',
	bgGradientOuter: '#000000',
	textPrimary: '#EEEEEE',
	textSecondary: '#AAAAAA',
	textMuted: '#666666',
	tileBg: '#161616',
	tileBgFocus: '#202020',
	tileBorder: '#2a2a2a',
	tileBorderFocus: '#EEEEEE',
	badge: '#EEEEEE',
	badgeText: '#000000',
	liftShadow: 'rgba(0, 0, 0, 0.7)',
	buttonBorder: '#3a3a3a',
	buttonActiveBg: '#EEEEEE',
	buttonActiveText: '#000000',
	switchTrack: '#333333',
	switchTrackOn: '#EEEEEE',
	switchKnob: '#AAAAAA',
	switchKnobOn: '#000000',
	danger: '#e0564f'
} as const;

export const FONT = {
	family: '"Inter Variable", "LG Smart UI", "Helvetica Neue", Arial, sans-serif',
	greeting: 72,
	clock: 32,
	clockTime: 44,
	rowLabel: 20,
	tileLabel: 19,
	settingsTitle: 40,
	settingsTab: 26,
	settingsButton: 22,
	optionLabel: 26,
	optionDescription: 20,
	clockPeriod: 22,
	toast: 24
} as const;

export const LAYOUT = {
	screenWidth: 1920,
	screenHeight: 1080,
	edgePadding: 140,       // heavy padding around the screen edges
	headerTop: 84,
	rowsTop: 236,           // rows start here, below the greeting and clock
	tileSize: 144,          // app / source tiles are square
	tileGap: 28,
	tileRadius: 24,
	rowLabelGap: 14,        // gap between a row's subheader and its tiles
	rowGap: 28,             // vertical space between rows
	gridColumns: 9          // settings picker grid
} as const;

export const MOTION = {
	focusMs: 160,
	scrollMs: 260,
	focusScale: 1.12,
	liftScale: 1.2,         // a tile picked up in re-order mode
	unfocusedRowOpacity: 0.55
} as const;

/** Writes every token onto :root as --color-*, --font-*, --layout-*, --motion-*. */
export function applyTokens (root: HTMLElement = document.documentElement): void {
	const groups: Record<string, Record<string, string | number>> = {color: COLOR, font: FONT, layout: LAYOUT, motion: MOTION};
	for (const group in groups) {
		const values = groups[group];
		for (const key in values) {
			const value = values[key];
			const unit = typeof value === 'number' && !/scale|opacity|columns/i.test(key) ? (key.endsWith('Ms') ? 'ms' : 'px') : '';
			root.style.setProperty(`--${group}-${kebab(key)}`, `${value}${unit}`);
		}
	}
}

function kebab (s: string): string {
	return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}
