import {useEffect, useState} from 'preact/hooks';
import type {TimeFormat} from '../lib/clock';
import {DEFAULT_TIME_FORMAT, getTimeFormat} from '../lib/timeFormat';

/** The TV's 12/24-hour setting, re-read whenever the app comes to the foreground
 *  (the user may have changed it in LG's settings meanwhile). */
export function useTimeFormat (): TimeFormat {
	const [format, setFormat] = useState<TimeFormat>(DEFAULT_TIME_FORMAT);
	useEffect(() => {
		const refresh = () => { if (!document.hidden) getTimeFormat().then(setFormat); };
		refresh();
		document.addEventListener('visibilitychange', refresh);
		return () => document.removeEventListener('visibilitychange', refresh);
	}, []);
	return format;
}
