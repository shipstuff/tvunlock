export interface ToastMessage {
	text: string;
	kind?: 'info' | 'error';
}

export function Toast ({message}: {message: ToastMessage | null}) {
	if (!message) return null;
	return <div class={`toast${message.kind === 'error' ? ' toast--error' : ''}`}>{message.text}</div>;
}
