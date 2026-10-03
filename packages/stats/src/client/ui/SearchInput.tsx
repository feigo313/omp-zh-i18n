import { Search } from "lucide-react";
import { useTranslation } from "../i18n";

export interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	width?: number;
}

/** Text filter with a leading search glyph. */
export function SearchInput({ value, onChange, placeholder, width }: SearchInputProps) {
	const { t } = useTranslation();
	return (
		<label className="search">
			<Search size={14} />
			<input
				className="input"
				type="search"
				value={value}
				placeholder={placeholder ?? t("common.hint.filterPlaceholder")}
				onChange={e => onChange(e.target.value)}
				style={width !== undefined ? { width } : undefined}
			/>
		</label>
	);
}
