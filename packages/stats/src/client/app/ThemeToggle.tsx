import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "../i18n";
import { type ThemePreference, useThemePreference } from "../useSystemTheme";

const NEXT_PREFERENCE: Record<ThemePreference, ThemePreference> = {
	system: "light",
	light: "dark",
	dark: "system",
};

const PREFERENCE_ICON: Record<ThemePreference, LucideIcon> = {
	system: Monitor,
	light: Sun,
	dark: Moon,
};

export function ThemeToggle() {
	const { t } = useTranslation();
	const { preference, setPreference } = useThemePreference();
	const Icon = PREFERENCE_ICON[preference];

	const nextPreference = NEXT_PREFERENCE[preference];
	const nextLabelKey = `theme.${nextPreference}` as const;
	const nextLabel = t(nextLabelKey);

	return (
		<button
			type="button"
			className="stats-theme-toggle"
			onClick={() => setPreference(nextPreference)}
			aria-label={t("theme.switchHint", { theme: nextLabel })}
			title={t("theme.switchHint", { theme: nextLabel })}
		>
			<Icon size={16} />
		</button>
	);
}
