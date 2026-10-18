import {useCallback, useState} from 'preact/hooks';
import {Header} from '../components/Header';
import {Clock} from '../components/Clock';
import {Row} from '../components/Row';
import type {TileModel} from '../components/Tile';
import {useKeys, clamp, type NavKey} from '../hooks/useKeys';
import {useClock} from '../hooks/useClock';
import {useTimeFormat} from '../hooks/useTimeFormat';

export interface HomeRow {
	id: string;
	label: string;
	items: TileModel[];
	emptyText?: string;
}

interface Props {
	rows: HomeRow[];
	active: boolean;
	onActivate: (rowId: string, item: TileModel) => void;
}

/** The home screen: greeting, clock and the navigable rows.
 *  Up/Down move between rows (each row remembers its column), Left/Right move along a row. */
export function Home ({rows, active, onActivate}: Props) {
	const now = useClock();
	const timeFormat = useTimeFormat();
	const [rowIndex, setRowIndex] = useState(0);
	const [columns, setColumns] = useState<Record<string, number>>({});

	const columnOf = (row: HomeRow) => clamp(columns[row.id] || 0, 0, Math.max(0, row.items.length - 1));
	const setColumn = (rowId: string, col: number) => setColumns((c) => ({...c, [rowId]: col}));

	const handleKey = useCallback((key: NavKey): boolean => {
		const row = rows[rowIndex];
		if (!row) return false;
		switch (key) {
			case 'up': setRowIndex((r) => clamp(r - 1, 0, rows.length - 1)); return true;
			case 'down': setRowIndex((r) => clamp(r + 1, 0, rows.length - 1)); return true;
			case 'left': setColumn(row.id, clamp(columnOf(row) - 1, 0, row.items.length - 1)); return true;
			case 'right': setColumn(row.id, clamp(columnOf(row) + 1, 0, row.items.length - 1)); return true;
			case 'enter': {
				const item = row.items[columnOf(row)];
				if (item) onActivate(row.id, item);
				return true;
			}
			case 'back': return true;   // swallow: Back on the home screen does nothing
		}
	}, [rows, rowIndex, columns, onActivate]);

	useKeys(handleKey, active);

	return (
		<div class="screen">
			<Header now={now} />
			<Clock now={now} format={timeFormat} />
			<div class="rows">
				{rows.map((row, i) => (
					<Row
						key={row.id}
						label={row.label}
						items={row.items}
						emptyText={row.emptyText}
						focused={i === rowIndex}
						selected={columnOf(row)}
						onSelect={(col) => { setRowIndex(i); setColumn(row.id, col); }}
						onActivate={(col) => onActivate(row.id, row.items[col])}
					/>
				))}
			</div>
		</div>
	);
}
