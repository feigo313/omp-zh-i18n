/**
 * Markdown Prompt 翻译加载器
 *
 * 加载策略：
 * 1. 优先从包内 bundled lang/prompts/ 目录加载（随代码分发）
 * 2. 再从 ~/.omp/lang/prompts/ 加载用户覆盖（可选）
 * 找不到翻译则使用原始英文版本
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** 包内 bundled prompt 翻译目录 */
const BUNDLED_PROMPTS_DIR = join(fileURLToPath(import.meta.url), "..", "lang", "prompts");

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
	// 确定语言
	const lang = detectLanguage();

	// 如果是英文，直接返回原文
	if (lang === "en") {
		return originalContent;
	}

	// 检查缓存
	// 构造翻译文件路径（用户覆盖优先，bundled 兜底）
	const userPath = join(homedir(), ".omp", "lang", "prompts", lang, `${promptPath}.md`);
	const bundledPath = join(BUNDLED_PROMPTS_DIR, lang, `${promptPath}.md`);

	// 用户覆盖优先
	const translatedPath = existsSync(userPath) ? userPath : bundledPath;

	// 检查翻译文件是否存在
	if (existsSync(translatedPath)) {
		try {
			const translated = readFileSync(translatedPath, "utf-8");
			promptCache.set(cacheKey, translated);
			return translated;
		} catch (error) {
			// 加载失败，回退到原文
			if (process.env.NODE_ENV === "development") {
				console.warn(`[i18n] Failed to load translated prompt: ${translatedPath}`, error);
			}
		}
	}

	// 找不到翻译，返回原文
	promptCache.set(cacheKey, originalContent);
	return originalContent;
}

/**
 * 检测语言设置
 */
function detectLanguage(): string {
	// 优先使用 OMP_LANG
	if (process.env.OMP_LANG) {
		return process.env.OMP_LANG;
	}

	// 其次使用系统 LANG
	const sysLang = process.env.LANG?.split(".")[0];
	if (sysLang) {
		// 处理 zh_CN -> zh
		return sysLang.split("_")[0];
	}

	// 默认英文
	return "en";
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
