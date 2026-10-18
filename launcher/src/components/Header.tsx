import {greeting} from '../lib/clock';

export function Header ({now}: {now: Date}) {
	return (
		<header class="header">
			<h1 class="header__greeting">{greeting(now)}</h1>
		</header>
	);
}
