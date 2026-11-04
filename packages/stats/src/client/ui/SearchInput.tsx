import { Search } from "lucide-react";
import { useTranslation } from "../i18n";

export interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	label?: string;
	width?: number;
}

/** Text filter with a leading search glyph. */
export function SearchInput({ value, onChange, placeholder, label = "Filter", width }: SearchInputProps) {
	const { t } = useTranslation();
	return (
		<label className="search">
			<Search size={14} />
			<input
				className="input"
				type="search"
				aria-label={label}
				value={value}
				placeholder={placeholder ?? t("common.hint.filterPlaceholder")}
				onChange={e => onChange(e.target.value)}
				style={width !== undefined ? { width } : undefined}
			/>
		</label>
	);
}
