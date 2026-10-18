import {useEffect} from 'preact/hooks';
import {KEY} from '../config/constants';

export type NavKey = 'left' | 'right' | 'up' | 'down' | 'enter' | 'back';

const CODE_TO_KEY: Record<number, NavKey> = {
	[KEY.left]: 'left', [KEY.right]: 'right', [KEY.up]: 'up', [KEY.down]: 'down',
	[KEY.enter]: 'enter', [KEY.back]: 'back', [KEY.escape]: 'back'
};

/** Subscribes to remote-control keys while `active`. The handler returns true when it
 *  consumed the key (stops the TV's default handling, e.g. Back closing the app). */
export function useKeys (handler: (key: NavKey, event: KeyboardEvent) => boolean | void, active = true): void {
	useEffect(() => {
		if (!active) return;
		const onKeyDown = (e: KeyboardEvent) => {
			const key = CODE_TO_KEY[e.keyCode];
			if (!key) return;
			if (handler(key, e) !== false) e.preventDefault();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [handler, active]);
}

/** Clamp helper shared by the navigation code. */
export function clamp (n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}
