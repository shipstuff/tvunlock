import {LUNA, SYSTEM_APP} from '../config/constants';
import {lunaCall} from './luna';

/** Launch an app or switch to an input (HDMI inputs are apps too: com.webos.app.hdmiN). */
export function launchApp (id: string, params: object = {}): Promise<void> {
	return lunaCall(LUNA.launch, {id, params}).then(() => undefined);
}

/** Bring up LG's own home screen. */
export function launchLgHome (): Promise<void> {
	return appExists(SYSTEM_APP.lgHome).then((installed) =>
		launchApp(installed ? SYSTEM_APP.lgHome : 'com.webos.app.home')
	);
}

/** Whether an app with this ID exists on the TV (permitted from a web app, unlike listing). */
export function appExists (id: string): Promise<boolean> {
	return lunaCall<{exist?: boolean}>(LUNA.appLoadStatus, {appId: id})
		.then((r) => r.exist === true)
		.catch(() => false);
}
