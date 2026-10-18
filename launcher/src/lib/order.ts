// Pure list helpers for re-ordering.

/** Returns a copy of `list` with the item at `from` moved to `to` (both clamped). */
export function moveItem<T> (list: T[], from: number, to: number): T[] {
	const last = list.length - 1;
	const src = Math.max(0, Math.min(last, from));
	const dst = Math.max(0, Math.min(last, to));
	if (src === dst) return list.slice();
	const next = list.slice();
	const [item] = next.splice(src, 1);
	next.splice(dst, 0, item);
	return next;
}
