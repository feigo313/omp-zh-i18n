/**
 * Settings declared by the localization domain (see `config/registry.ts`).
 *
 * This domain is fork-only: `i18n.language` is what the settings overlay writes
 * when the user switches UI language, and `selector-controller.handleSettingChange`
 * reacts to it by reloading the dictionaries and invalidating the UI. Upstream
 * v18.3.1 has no i18n domain, so `config/all-settings.ts` imports this module
 * alongside the upstream ones.
 */
import { combine, register, type SettingValueOf } from "../config/registry";

export const cfgI18nLanguage = register({
	id: "i18n.language",
	type: "enum",
	values: ["en", "zh"] as const,
	default: "en",
	ui: {
		tab: "interaction",
		group: "Language",
		label: "Language",
		description: "UI language (applies on next screen refresh)",
		options: [
			{ value: "en", label: "English" },
			{ value: "zh", label: "简体中文" },
		],
	},
});

/** UI language selection ({@link cfgI18nLanguage}). */
export const cfgI18n = combine({
	language: cfgI18nLanguage,
});

/** UI language selection ({@link cfgI18n}). */
export type I18nSettings = SettingValueOf<typeof cfgI18n>;
