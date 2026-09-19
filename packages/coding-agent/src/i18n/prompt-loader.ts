/**
 * Markdown Prompt 翻译加载器
 *
 * 加载策略：
 * 1. 优先从包内 bundled lang/prompts/ 目录加载（随代码分发）
 * 2. 再从 ~/.omp/lang/prompts/ 加载用户覆盖（可选）
 * 找不到翻译则使用原始英文版本
 */

import * as fs from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { getLanguage } from "./index";

/** 包内 bundled prompt 翻译目录 */
const BUNDLED_PROMPTS_DIR = join(import.meta.dir, "..", "lang", "prompts");

/**
 * Prompt 翻译缓存
 */
const promptCache = new Map<string, string>();

/**
 * 加载翻译的 prompt 文件
 *
 * @param promptPath prompt 相对路径（不含 .md 后缀），如 "system/system-prompt"
 * @param originalContent 原始英文内容
 * @returns 翻译后的内容（如果存在）或原始内容
 *
 * @example
 * import originalPrompt from "./prompts/system/system-prompt.md" with { type: "text" };
 * import { loadTranslatedPrompt } from "../i18n/prompt-loader";
 *
 * const systemPrompt = loadTranslatedPrompt("system/system-prompt", originalPrompt);
 */
export function loadTranslatedPrompt(promptPath: string, originalContent: string): string {
	// 委托主 i18n 系统检测语言（OMP_LANG → config.yml → en）
	const lang = getLanguage();

	// 如果是英文，直接返回原文
	if (lang === "en") {
		return originalContent;
	}

	// 检查缓存
	const cached = promptCache.get(promptPath);
	if (cached !== undefined) {
		return cached;
	}

	// 构造翻译文件路径（用户覆盖优先，bundled 兜底）
	const userPath = join(homedir(), ".omp", "lang", "prompts", lang, `${promptPath}.md`);
	const bundledPath = join(BUNDLED_PROMPTS_DIR, lang, `${promptPath}.md`);

	// 用户覆盖优先 — 用 try/catch 一次读取，避免 TOCTOU
	const translatedPath = userPath;
	try {
		const translated = fs.readFileSync(translatedPath, "utf-8");
		promptCache.set(promptPath, translated);
		return translated;
	} catch {
		// userPath 不存在或读取失败，尝试 bundled
	}

	try {
		const translated = fs.readFileSync(bundledPath, "utf-8");
		promptCache.set(promptPath, translated);
		return translated;
	} catch {
		// bundled 也不存在，回退到原文
	}

	promptCache.set(promptPath, originalContent);
	return originalContent;
}

/**
 * 清除 prompt 缓存（用于语言切换）
 */
export function clearPromptCache(): void {
	promptCache.clear();
}

/**
 * 获取缓存统计信息（用于调试）
 */
export function getPromptCacheStats(): { size: number; keys: string[] } {
	return {
		size: promptCache.size,
		keys: Array.from(promptCache.keys()),
	};
}
