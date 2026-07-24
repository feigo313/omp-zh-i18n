/**
 * i18n 拦截层
 *
 * 在 UI 渲染边界拦截数据，统一注入翻译。
 * 源码保持纯英文，翻译在数据输出时集中处理。
 */

import type { SettingTab, SubmenuOption } from "../config/settings-schema";
import type { SettingDef, SubmenuSettingDef } from "../modes/components/settings-defs";
import { i18n } from "./index";

// ═══════════════════════════════════════════════════════════════════════════
// Settings 拦截
// ═══════════════════════════════════════════════════════════════════════════

/** Translate a single SubmenuOption's label and description */
function translateOption(path: string, option: SubmenuOption): SubmenuOption {
	return {
		...option,
		label: i18n.t(`settings.${path}.options.${option.value}.label`, option.label),
		description:
			option.description !== undefined
				? i18n.t(`settings.${path}.options.${option.value}.description`, option.description)
				: undefined,
	};
}

/** Translate a single SettingDef's label, description, and submenu options */
function translateDef(def: SettingDef): SettingDef {
	const translated: SettingDef = {
		...def,
		label: i18n.t(`settings.${def.path}.label`, def.label),
		description: i18n.t(`settings.${def.path}.description`, def.description),
	};
	// Translate submenu options (label + optional description)
	if (translated.type === "submenu") {
		(translated as SubmenuSettingDef).options = (def as SubmenuSettingDef).options.map(o =>
			translateOption(def.path, o),
		);
	}
	return translated;
}

/**
 * 拦截 SettingDef 数组，批量翻译 label/description。
 * 在 getAllSettingDefs() 的输出口调用。
 */
export function interceptSettingDefs(defs: SettingDef[]): SettingDef[] {
	if (i18n.getLanguage() === "en") return defs;
	return defs.map(translateDef);
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab & Group 标签拦截
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 拦截 Tab 标签。调用方传入原始英文 label，返回翻译或原文。
 * 用于 settings-selector.ts 的 Tab 构建处。
 */
export function interceptTabLabel(tab: string, englishLabel: string): string {
	return i18n.t(`tabs.${tab}.label`, englishLabel);
}

/**
 * 拦截 Group 标题。调用方传入原始英文 group 名，返回翻译或原文。
 * 用于 settings-selector.ts 的分组标题渲染处。
 */
export function interceptGroupLabel(tab: SettingTab, group: string): string {
	const translated = i18n.t(`tabs.${tab}.groups.${group}`);
	return translated === `tabs.${tab}.groups.${group}` ? group : translated;
}

/**
 * 拦截 Plugins tab 标签
 */
export function interceptPluginsLabel(englishLabel: string): string {
	return i18n.t("tabs.plugins.label", englishLabel);
}

// ═══════════════════════════════════════════════════════════════════════════
// UI 字符串拦截
// ═══════════════════════════════════════════════════════════════════════════

/** 拦截通用 UI 字符串 */
export function interceptUIString(key: string, english: string): string {
	return i18n.t(key, english);
}

// ═══════════════════════════════════════════════════════════════════════════
// Welcome UI 字符串拦截
// ═══════════════════════════════════════════════════════════════════════════

/** Welcome 页面 UI 字符串翻译 */
export function interceptWelcomeString(key: string): string {
	const englishMap: Record<string, string> = {
		back: "Welcome back!",
		"welcome.back": "Welcome back!",
		noRecentSessions: "No recent sessions",
		noLspServers: "No LSP servers",
		tips: "Tips",
		"tips.promptActions": " for prompt actions",
		"tips.commands": " for commands",
		"tips.bash": " to run bash",
		"tips.python": " to run python",
		lspServers: "LSP Servers",
		recentSessions: "Recent sessions",
		tipLabel: "Tip: ",
		nerdfont: "Please use nerdfont 😭.",
	};
	const english = englishMap[key] ?? key;
	return i18n.t(key, english);
}

// ═══════════════════════════════════════════════════════════════════════════
// Tips 拦截
// ═══════════════════════════════════════════════════════════════════════════

/**
 * i18n keys for each tip, parallel to tips.txt lines (0-indexed).
 * If a tip doesn't have a translation key, it stays in English.
 */
const TIP_KEYS: readonly string[] = [
	"tips.tired_of_typing_keep_going",
	"tips.btw_side_question",
	"tips.tan_background_agent",
	"tips.ctrl_d_exit",
	"tips.ompt_stats",
	"tips.task_isolation",
	"tips.completion_nested",
	"tips.spaghetti_code",
	"tips.multi_session",
	"tips.ultrathink",
	"tips.orchestrate",
	"tips.workflowz",
	"tips.multi_account",
	"tips.auth_broker",
	"tips.switch_provider",
	"tips.ctrl_r_history",
	"tips.force_read",
	"tips.copy_code",
	"tips.shake",
	"tips.collab",
	"tips.inspect_transcript",
	"tips.usage_reset",
	"tips.pi_dialect",
	"tips.advisor",
];

/**
 * Translate tips array. Each English tip at index i is translated using TIP_KEYS[i].
 */
export function interceptTips(enTips: readonly string[]): readonly string[] {
	if (i18n.getLanguage() === "en") return enTips;
	return enTips.map((tip, i) => {
		const key = TIP_KEYS[i];
		if (!key) return tip;
		const translated = i18n.t(key);
		return translated !== key ? translated : tip;
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI Help 拦截
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CLI translator 函数，供 cli.ts 的 run() translator 参数使用。
 * 拦截命令帮助文本的渲染。
 */
export function cliTranslator(text: string, key: string): string {
	const translated = i18n.t(key);
	return translated === key ? text : translated;
}

// ═══════════════════════════════════════════════════════════════════════════
// Slash Commands 拦截
// ═══════════════════════════════════════════════════════════════════════════

export interface SlashCommandTranslationInput {
	name: string;
	description: string;
	subcommands?: Array<{ name: string; description: string }>;
}

export interface SlashCommandTranslationOutput {
	description: string;
	subcommands?: Array<{ name: string; description: string }>;
}

/**
 * 拦截单个 slash command 的描述字段，返回翻译后的值。
 * 调用方在 materialize 时传入原始数据，拦截层返回翻译。
 */
export function interceptSlashCommand(input: SlashCommandTranslationInput): SlashCommandTranslationOutput {
	const result: SlashCommandTranslationOutput = {
		description: i18n.t(`commands.${input.name}.description`, input.description),
	};
	if (input.subcommands) {
		result.subcommands = input.subcommands.map(sub => ({
			...sub,
			description: i18n.t(`commands.${input.name}.subcommands.${sub.name}`, sub.description),
		}));
	}
	return result;
}
