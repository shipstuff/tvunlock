import {LAYOUT} from '../theme/tokens';
import {clamp} from '../hooks/useKeys';
import {Tile, type TileModel} from './Tile';

interface Props {
	items: TileModel[];
	/** select: tick badges on chosen items, others dimmed. reorder: plain tiles. */
	mode: 'select' | 'reorder';
	checkedKeys: string[];
	/** index of the tile picked up in re-order mode, or -1 */
	liftedIndex: number;
	focused: boolean;
	selected: number;
	onSelect: (index: number) => void;
	onActivate: (index: number) => void;
}

const VIEWPORT_HEIGHT = 720;          // matches .grid__viewport height in global.css
const LABEL_HEIGHT = 60;              // two-line tile label + its top margin (see .tile__label)
const GRID_ROW_GAP = 40;              // matches .grid__track grid-row-gap
const ROW_STEP = LAYOUT.tileSize + LABEL_HEIGHT + GRID_ROW_GAP;

/** Full grid of tiles; scrolls vertically to keep the focused row in view. */
export function Grid ({items, mode, checkedKeys, liftedIndex, focused, selected, onSelect, onActivate}: Props) {
	const rows = Math.ceil(items.length / LAYOUT.gridColumns);
	const total = rows * ROW_STEP - GRID_ROW_GAP;
	const rowIndex = Math.floor(selected / LAYOUT.gridColumns);
	const offset = total <= VIEWPORT_HEIGHT ? 0
		: clamp(rowIndex * ROW_STEP - (VIEWPORT_HEIGHT - ROW_STEP) / 2, 0, total - VIEWPORT_HEIGHT);

	return (
		<div class="grid__viewport">
			<div class="grid__track" style={{transform: `translateY(${-offset}px)`}}>
				{items.map((item, i) => {
					const checked = mode === 'select' && checkedKeys.indexOf(item.key) !== -1;
					return (
						<Tile
							key={item.key}
							model={item}
							focused={focused && i === selected}
							lifted={i === liftedIndex}
							checked={checked}
							dimmed={mode === 'select' && !checked}
							onHover={() => onSelect(i)}
							onActivate={() => onActivate(i)}
						/>
					);
				})}
			</div>
		</div>
	);
}
