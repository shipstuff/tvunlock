// Magic Remote pointer control.
//
// The pointer is drawn by the TV's compositor, not the page, so CSS `cursor: none` has
// no effect. webOS gives web apps `webOSSystem.setCursorHidden()` for this: it hides the
// pointer the same way pressing an arrow key does, and the system shows it again when
// the user shakes or moves the remote. So hiding on launch/foreground doesn't stop the
// user switching back to pointer mode.

interface WebOSSystemCursor {
	setCursorHidden? (hidden: boolean): void;
}

declare global {
	interface Window {
		webOSSystem?: WebOSSystemCursor;
		PalmSystem?: WebOSSystemCursor;
	}
}

/** Hide the pointer now. No-op off webOS or on firmware without the API. */
export function hidePointer (): void {
	const sys = window.webOSSystem || window.PalmSystem;
	if (!sys || typeof sys.setCursorHidden !== 'function') return;
	try { sys.setCursorHidden(true); }
	catch { /* best effort */ }
}

/** Hide the pointer on launch and every time the app comes back to the foreground
 *  (including relaunches while already running, e.g. from a remapped HOME button).
 *  Returns an unsubscribe function. */
export function hidePointerOnForeground (): () => void {
	const onVisible = () => { if (!document.hidden) hidePointer(); };
	hidePointer();
	document.addEventListener('visibilitychange', onVisible);
	document.addEventListener('webOSRelaunch', onVisible);
	return () => {
		document.removeEventListener('visibilitychange', onVisible);
		document.removeEventListener('webOSRelaunch', onVisible);
	};
}
