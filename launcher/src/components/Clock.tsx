import {dateText, dayName, timeParts, type TimeFormat} from '../lib/clock';

export function Clock ({now, format}: {now: Date; format: TimeFormat}) {
	const {time, period} = timeParts(now, format);
	return (
		<div class="clock">
			<div class="clock__line">{dayName(now)}</div>
			<div class="clock__line">{dateText(now)}</div>
			<div class="clock__time">
				{time}
				{period && <span class="clock__period">{period}</span>}
			</div>
		</div>
	);
}
