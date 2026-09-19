/**
 * i18n 拦截层
 *
 * 在 UI 渲染边界拦截数据，统一注入翻译。
 * 源码保持纯英文，翻译在数据输出时集中处理。
 *
 * Settings/welcome/overlay 的拦截自 v18 起由 packages/tui 的 i18n-host
 * seam 承担（tui 包无法反向依赖本包）；本文件只保留 coding-agent 侧的
 * slash 命令拦截。
 */

import { i18n } from "./index";

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
			description: i18n.t(`commands.${input.name}.subcommands.${sub.name}.description`, sub.description),
		}));
	}
	return result;
}
