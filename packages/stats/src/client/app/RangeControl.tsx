import { useTranslation } from "../i18n";
import type { TimeRange } from "../types";

export interface RangeControlProps {
	value: TimeRange;
	onChange: (value: TimeRange) => void;
	className?: string;
}

const RANGE_VALUES: TimeRange[] = ["1h", "24h", "7d", "30d", "90d", "all"];

export function RangeControl({ value, onChange, className = "" }: RangeControlProps) {
	const { t } = useTranslation();

	return (
		<div className={`stats-range-control ${className}`} role="radiogroup" aria-label={t("rangeControl.selectRange")}>
			{RANGE_VALUES.map(rangeValue => {
				const isActive = rangeValue === value;
				const label = rangeValue === "all" ? t("rangeControl.all") : rangeValue;
				return (
					<button
						key={rangeValue}
						type="button"
						role="radio"
						aria-checked={isActive}
						data-active={isActive ? "true" : "false"}
						className="stats-range-control-btn"
						onClick={() => onChange(rangeValue)}
					>
						{label}
					</button>
				);
			})}
		</div>
	);
}
