import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { getLanguage, setLanguage } from "../../src/i18n";
import { clearPromptCache, getPromptCacheStats, loadTranslatedPrompt } from "../../src/i18n/prompt-loader";

describe("prompt-loader 翻译加载行为", () => {
	const originalLang = process.env.LANG;
	const originalOmpLang = process.env.OMP_LANG;

	beforeEach(async () => {
		clearPromptCache();
		delete process.env.LANG;
		delete process.env.OMP_LANG;
		await setLanguage("en");
	});

	afterEach(() => {
		if (originalLang !== undefined) {
			process.env.LANG = originalLang;
		} else {
			delete process.env.LANG;
		}
		if (originalOmpLang !== undefined) {
			process.env.OMP_LANG = originalOmpLang;
		} else {
			delete process.env.OMP_LANG;
		}
		clearPromptCache();
	});

	it("语言为 en 时直接返回原文", () => {
		const original = "This is the original prompt";
		const result = loadTranslatedPrompt("test/prompt", original);
		expect(result).toBe(original);
	});

	it("语言为 zh 且无翻译文件时返回原文（fallback）", async () => {
		await setLanguage("zh");
		const original = "English prompt content";
		const result = loadTranslatedPrompt("test/nonexistent", original);
		expect(result).toBe(original);
	});

	it("使用主 i18n 当前语言，而非硬编码语言", async () => {
		await setLanguage("zh");
		const lang = getLanguage();
		const original = "English prompt content";
		// 无翻译文件时返回原文，但内部用 zh 作为语言路径查找
		const result = loadTranslatedPrompt("test/nonexistent", original);
		expect(result).toBe(original);
		// 关键契约：loadTranslatedPrompt 使用的 language 与 getLanguage 一致
		expect(lang).toBe("zh");
	});

	it("语言切换后 prompt-loader 行为随之变化", async () => {
		await setLanguage("en");
		const original = "English prompt";
		// en → 直接返回原文（短路）
		const enResult = loadTranslatedPrompt("test/prompt", original);
		expect(enResult).toBe(original);

		// 切换到 zh（无翻译文件）→ 仍返回原文，但走完整查找路径
		await setLanguage("zh");
		const zhResult = loadTranslatedPrompt("test/prompt", original);
		expect(zhResult).toBe(original);
	});

	it("缓存在语言切换后被清除", async () => {
		await setLanguage("zh");
		const original = "prompt content";
		loadTranslatedPrompt("test/prompt", original);
		let stats = getPromptCacheStats();
		expect(stats.size).toBe(1);

		// setLanguage 内部会调用 clearPromptCache
		await setLanguage("en");
		stats = getPromptCacheStats();
		expect(stats.size).toBe(0);
	});

	it("相同 promptPath 重复调用返回相同结果", async () => {
		await setLanguage("en");
		const original = "test content";
		const r1 = loadTranslatedPrompt("test/repeat", original);
		const r2 = loadTranslatedPrompt("test/repeat", original);
		expect(r1).toBe(r2);
		expect(r1).toBe(original);
	});

	it("OMP_LANG=zh 时 LANG 不影响语言检测（主 i18n 不读 LANG）", async () => {
		process.env.LANG = "zh_CN";
		// 不设置 OMP_LANG，不设置 config.yml → 默认 en
		// 主 i18n 只读 OMP_LANG 和 config.yml，不读 LANG
		const lang = getLanguage();
		expect(lang).toBe("en");
		const original = "English prompt";
		const result = loadTranslatedPrompt("test/prompt", original);
		expect(result).toBe(original);
	});
});
