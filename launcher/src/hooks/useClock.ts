import {useEffect, useState} from 'preact/hooks';
import {TIMING} from '../config/constants';

/** Current time, re-rendered once a second (only changes when the minute changes
 *  matter to the UI, but a 1s tick keeps the displayed minute exact). */
export function useClock (): Date {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), TIMING.clockTickMs);
		return () => window.clearInterval(id);
	}, []);
	return now;
}
