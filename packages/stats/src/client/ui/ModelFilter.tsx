import { useTranslation } from "../i18n";

export interface ModelFilterProps {
	models: string[];
	value: string | null;
	onChange: (model: string | null) => void;
}

export function ModelFilter({ models, value, onChange }: ModelFilterProps) {
	const { t } = useTranslation();

	if (models.length === 0) return null;

	return (
		<select
			className="stats-model-filter"
			value={value ?? ""}
			onChange={e => onChange(e.target.value || null)}
			aria-label={t("common.model")}
		>
			<option value="">{t("requests.filterAllModels")}</option>
			{models.map(model => (
				<option key={model} value={model}>
					{model}
				</option>
			))}
		</select>
	);
}
