export interface OptionItem {
	id: string;
	label: string;
	description: string;
	value: boolean;
}

interface Props {
	options: OptionItem[];
	focused: boolean;
	selected: number;
	onSelect: (index: number) => void;
	onActivate: (index: number) => void;
}

/** Vertical list of on/off options. */
export function OptionList ({options, focused, selected, onSelect, onActivate}: Props) {
	return (
		<div class="options">
			{options.map((o, i) => (
				<div
					key={o.id}
					class={`option${focused && i === selected ? ' option--focused' : ''}`}
					onMouseEnter={() => onSelect(i)}
					onClick={() => onActivate(i)}
				>
					<div class="option__text">
						<div class="option__label">{o.label}</div>
						<div class="option__description">{o.description}</div>
					</div>
					<div class={`switch${o.value ? ' switch--on' : ''}`} role="switch" aria-checked={o.value}>
						<div class="switch__knob" />
					</div>
				</div>
			))}
		</div>
	);
}
