/**
 * 国际化 (i18n) 核心模块
 *
 * 翻译文件加载策略：
 * 1. 优先从包内 bundled lang/ 目录加载（随代码分发）
 * 2. 再从 ~/.omp/lang/ 加载用户覆盖（可选）
 * 支持插值和 fallback 机制
 */

import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { getAgentDir, isEnoent, logger } from "@oh-my-pi/pi-utils";

// 静态导入翻译文件（编译时嵌入到二进制）
import zhCommands from "./lang/zh-commands.json" with { type: "json" };
import zhHotkeys from "./lang/zh-hotkeys.json" with { type: "json" };
import zhRuntime from "./lang/zh-runtime.json" with { type: "json" };
import zhSettingsAppearance from "./lang/zh-settings-appearance.json" with { type: "json" };
import zhSettingsContext from "./lang/zh-settings-context.json" with { type: "json" };
import zhSettingsFiles from "./lang/zh-settings-files.json" with { type: "json" };
import zhSettingsInteraction from "./lang/zh-settings-interaction.json" with { type: "json" };
import zhSettingsMemory from "./lang/zh-settings-memory.json" with { type: "json" };
import zhSettingsModel from "./lang/zh-settings-model.json" with { type: "json" };
import zhSettingsProviders from "./lang/zh-settings-providers.json" with { type: "json" };
import zhSettingsShell from "./lang/zh-settings-shell.json" with { type: "json" };
import zhSettingsTasks from "./lang/zh-settings-tasks.json" with { type: "json" };
import zhSettingsTools from "./lang/zh-settings-tools.json" with { type: "json" };
import zhTips from "./lang/zh-tips.json" with { type: "json" };
import zhUi from "./lang/zh-ui.json" with { type: "json" };
import enCommands from "./lang/en-commands.json" with { type: "json" };
import enSettingsAppearance from "./lang/en-settings-appearance.json" with { type: "json" };
import enSettingsContext from "./lang/en-settings-context.json" with { type: "json" };
import enSettingsFiles from "./lang/en-settings-files.json" with { type: "json" };
import enSettingsFull from "./lang/en-settings-full.json" with { type: "json" };
import enSettingsInteraction from "./lang/en-settings-interaction.json" with { type: "json" };
import enSettingsMemory from "./lang/en-settings-memory.json" with { type: "json" };
import enSettingsModel from "./lang/en-settings-model.json" with { type: "json" };
import enSettingsProviders from "./lang/en-settings-providers.json" with { type: "json" };
import enSettingsShell from "./lang/en-settings-shell.json" with { type: "json" };
import enSettingsTasks from "./lang/en-settings-tasks.json" with { type: "json" };
import enSettingsTools from "./lang/en-settings-tools.json" with { type: "json" };
import enJson from "./lang/en.json" with { type: "json" };

/** 包内 bundled 翻译目录 */
const BUNDLED_LAN_DIR = path.join(import.meta.dir, "lang");

/**
 * 编译时嵌入的翻译文件（用于二进制分发）
 */
const EMBEDDED_TRANSLATIONS: Record<string, TranslationFile> = {
	"zh-commands.json": zhCommands,
	"zh-hotkeys.json": zhHotkeys,
	"zh-runtime.json": zhRuntime,
	"zh-settings-appearance.json": zhSettingsAppearance,
	"zh-settings-context.json": zhSettingsContext,
	"zh-settings-files.json": zhSettingsFiles,
	"zh-settings-interaction.json": zhSettingsInteraction,
	"zh-settings-memory.json": zhSettingsMemory,
	"zh-settings-model.json": zhSettingsModel,
	"zh-settings-providers.json": zhSettingsProviders,
	"zh-settings-shell.json": zhSettingsShell,
	"zh-settings-tasks.json": zhSettingsTasks,
	"zh-settings-tools.json": zhSettingsTools,
	"zh-tips.json": zhTips,
	"zh-ui.json": zhUi,
	"en-commands.json": enCommands,
	"en-settings-appearance.json": enSettingsAppearance,
	"en-settings-context.json": enSettingsContext,
	"en-settings-files.json": enSettingsFiles,
	"en-settings-full.json": enSettingsFull,
	"en-settings-interaction.json": enSettingsInteraction,
	"en-settings-memory.json": enSettingsMemory,
	"en-settings-model.json": enSettingsModel,
	"en-settings-providers.json": enSettingsProviders,
	"en-settings-shell.json": enSettingsShell,
	"en-settings-tasks.json": enSettingsTasks,
	"en-settings-tools.json": enSettingsTools,
	"en.json": enJson,
};

/**
 * 翻译字典类型
 */
export interface TranslationDict {
	[key: string]: string | TranslationDict;
}

/**
 * 翻译元数据
 */
export interface TranslationMeta {
	version?: string;
	upstream_commit?: string;
	lastUpdated?: string;
	completeness?: number;
}

/**
 * 完整的翻译文件结构
 */
export interface TranslationFile {
	meta?: TranslationMeta;
	[key: string]: string | TranslationDict | TranslationMeta | undefined;
}

/**
 * i18n 管理器
 */
class I18nManager {
	private dict: TranslationFile = {};
	private lang: string = "en";
	private lanDir: string;
	private useBundled: boolean;
	private initialized = false;

	constructor(lanDir?: string) {
		this.useBundled = lanDir === undefined;
		this.lanDir = lanDir ?? path.join(os.homedir(), ".omp", "lang");
	}

	/**
	 * 重置实例（用于测试）
	 */
	reset(lanDir?: string): void {
		this.dict = {};
		this.lang = "en";
		this.initialized = false;
		if (lanDir) {
			this.lanDir = lanDir;
			this.useBundled = false;
		}
	}

	/**
	 * 初始化 i18n 系统
	 */
	async init(): Promise<void> {
		if (this.initialized) return;

		this.lang = await this.detectLanguage();
		await this.loadTranslation(this.lang, this.dict);

		this.initialized = true;
	}

	/**
	 * 检测语言设置
	 * 优先读取 OMP_LANG 环境变量，其次从 config.yml 读取 i18n.language
	 */
	private async detectLanguage(): Promise<string> {
		// 环境变量优先
		if (process.env.OMP_LANG) {
			return process.env.OMP_LANG;
		}

		// 从 config.yml 读取
		try {
			const agentDir = getAgentDir();
			const configPath = path.join(agentDir, "config.yml");
			const content = await fs.readFile(configPath, "utf-8");
			// 匹配两种 YAML 格式：i18n:\n  language: zh（嵌套，settings 系统写入）
			// 或 i18n.language: zh（扁平，旧格式）。优先匹配嵌套格式。
			const match =
				content.match(/^\s*i18n:\s*\n\s*language:\s*["']?([^"'\s\n#]+)["']?/m) ||
				content.match(/^\s*i18n\.language:\s*["']?([^"'\s\n#]+)["']?/m);
			if (match) {
				const value = match[1].trim();
				if (value === "zh" || value === "en") {
					return value;
				}
			}
		} catch {
			// config.yml 不存在或读取失败，静默回退到 en
		}

		return "en";
	}

	/**
	 * 加载翻译文件
	 * 先加载包内 bundled 翻译，再用用户目录覆盖
	 */
	private async loadTranslation(lang: string, target: TranslationFile): Promise<void> {
		// 1. 加载包内 bundled 翻译（仅默认路径时）
		if (this.useBundled) {
			// 先尝试从目录加载（源码开发模式）
			const dirLoaded = await this.loadTranslationFromDir(lang, BUNDLED_LAN_DIR, target);
			// 如果目录加载失败（编译后的二进制），使用嵌入的翻译
			if (!dirLoaded) {
				this.loadEmbeddedTranslations(lang, target);
			}
		}
		// 2. 加载用户目录翻译
		await this.loadTranslationFromDir(lang, this.lanDir, target);
	}

	/**
	 * 从嵌入的翻译文件加载（编译后的二进制使用）
	 */
	private loadEmbeddedTranslations(lang: string, target: TranslationFile): void {
		for (const [filename, content] of Object.entries(EMBEDDED_TRANSLATIONS)) {
			if (filename.startsWith(`${lang}-`) || filename === `${lang}.json`) {
				this.mergeTranslations(target, content);
			}
		}
	}

	/**
	 * 从指定目录加载翻译文件
	 * @returns 是否成功加载（目录存在且有文件）
	 */
	private async loadTranslationFromDir(lang: string, dir: string, target: TranslationFile): Promise<boolean> {
		try {
			const files = await fs.readdir(dir);
			const langFiles = files.filter(f => f.startsWith(`${lang}-`) && f.endsWith(".json"));

			if (langFiles.length === 0) return false;

			for (const file of langFiles) {
				try {
					const filePath = path.join(dir, file);
					const content = await fs.readFile(filePath, "utf-8");
					const parsed = JSON.parse(content) as TranslationFile;
					this.mergeTranslations(target, parsed);
				} catch (error) {
					logger.warn(`Failed to load translation file: ${file}`, { error });
				}
			}
			return true;
		} catch (error) {
			// 目录不存在时静默失败
			if (!isEnoent(error)) {
				logger.warn(`Failed to read translation directory: ${dir}`, { error });
			}
			return false;
		}
	}

	/**
	 * 合并翻译
	 */
	private mergeTranslations(target: TranslationFile, source: TranslationFile): void {
		for (const [key, value] of Object.entries(source)) {
			if (key === "meta") {
				target.meta = value as TranslationMeta;
			} else if (typeof value === "string") {
				target[key] = value;
			} else if (typeof value === "object" && value !== null) {
				if (!target[key] || typeof target[key] !== "object") {
					target[key] = {};
				}
				this.mergeTranslations(target[key] as TranslationDict, value as TranslationDict);
			}
		}
	}

	/**
	 * 翻译字符串
	 *
	 * @param key 翻译键，支持点号分隔的嵌套键，如 "settings.theme.dark.label"
	 * @param fallback 如果找不到翻译，返回的默认值
	 * @param params 插值参数
	 */
	t(key: string, fallback?: string, params?: Record<string, unknown>): string {
		if (!this.initialized) {
			// 同步访问时使用未初始化的状态，返回 key
			return fallback || key;
		}

		// 先尝试直接查找扁平 key
		let value = this.dict[key];
		if (value !== undefined && typeof value === "string") {
			return params ? this.interpolate(value, params) : value;
		}

		// 再尝试嵌套查找
		value = this.getNestedValue(this.dict, key);
		if (value !== undefined && typeof value === "string") {
			return params ? this.interpolate(value, params) : value;
		}

		// 返回用户提供的 fallback 或 key 本身
		const result = fallback || key;
		return params ? this.interpolate(result, params) : result;
	}

	/**
	 * 获取嵌套值
	 */
	private getNestedValue(obj: unknown, key: string): string | TranslationDict | undefined {
		const keys = key.split(".");
		let current: unknown = obj;

		for (const k of keys) {
			if (current === undefined || current === null) return undefined;
			if (typeof current !== "object") return undefined;
			current = (current as Record<string, unknown>)[k];
		}

		return current as string | TranslationDict | undefined;
	}

	/**
	 * 插值替换
	 * 支持 {key} 格式
	 */
	private interpolate(template: string, params: Record<string, unknown>): string {
		return template.replace(/\{(\w+)\}/g, (match, key) => {
			return params[key] !== undefined ? String(params[key]) : match;
		});
	}

	/**
	 * 获取当前语言
	 */
	getLanguage(): string {
		return this.lang;
	}

	/**
	 * 设置语言（用于运行时切换，需要重新加载）
	 */
	async setLanguage(lang: string): Promise<void> {
		this.lang = lang;
		this.dict = {};
		this.initialized = false;
		await this.loadTranslation(lang, this.dict);
		this.initialized = true;

		// Clear all caches so UI reflects new language
		(await import("../modes/components/settings-defs")).invalidateSettingDefsCache();
		(await import("./prompt-loader")).clearPromptCache();
	}

	/**
	 * 检查翻译是否存在
	 */
	has(key: string): boolean {
		if (!this.initialized) return false;
		// 先检查扁平 key
		if (this.dict[key] !== undefined) return true;
		// 再检查嵌套 key
		return this.getNestedValue(this.dict, key) !== undefined;
	}

	/**
	 * 获取翻译元数据
	 */
	getMeta(): TranslationMeta | undefined {
		if (!this.initialized) return undefined;
		return this.dict.meta;
	}
}

// 全局单例（默认使用 ~/.omp/lang）
export const i18n = new I18nManager();

/**
 * 创建自定义 i18n 实例（用于测试）
 */
export function createI18n(lanDir?: string): I18nManager {
	return new I18nManager(lanDir);
}
export { I18nManager };

/**
 * 快捷翻译函数
 */
export function t(key: string, fallback?: string, params?: Record<string, unknown>): string {
	return i18n.t(key, fallback, params);
}

/**
 * 获取当前语言
 */
export function getLanguage(): string {
	return i18n.getLanguage();
}

/**
 * 设置语言
 */
export async function setLanguage(lang: string): Promise<void> {
	await i18n.setLanguage(lang);
}

/**
 * 检查翻译是否存在
 */
export function hasTranslation(key: string): boolean {
	return i18n.has(key);
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI 成本格式化（带汇率换算）
// ═══════════════════════════════════════════════════════════════════════════

const EXCHANGE_RATE_CACHE_FILE = path.join(os.homedir(), ".omp", "cache", "exchange-rate.json");
const EXCHANGE_RATE_API = "https://api.frankfurter.dev/v1/latest?from=USD&to=CNY";
const DEFAULT_RATE = 7.25;

interface ExchangeRateCache {
	rate: number;
	timestamp: number;
}

let cachedRate: ExchangeRateCache | null = null;
let ratePromise: Promise<void> | null = null;

async function loadCachedRate(): Promise<ExchangeRateCache> {
	try {
		const data = await Bun.file(EXCHANGE_RATE_CACHE_FILE).json();
		if (typeof data.rate === "number" && data.rate > 0 && typeof data.timestamp === "number") {
			return data as ExchangeRateCache;
		}
	} catch { /* ignore */ }
	return { rate: DEFAULT_RATE, timestamp: 0 };
}

async function persistRate(rate: number): Promise<void> {
	try {
		await Bun.write(EXCHANGE_RATE_CACHE_FILE, JSON.stringify({ rate, timestamp: Date.now() }));
	} catch { /* cache unavailable */ }
}

async function fetchRateOnce(): Promise<void> {
	if (ratePromise) return ratePromise;
	ratePromise = (async () => {
		try {
			const res = await fetch(EXCHANGE_RATE_API);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = (await res.json()) as { rates?: { CNY?: number } };
			const cny = json?.rates?.CNY;
			if (typeof cny !== "number" || cny <= 0) throw new Error("Invalid CNY rate");
			cachedRate = { rate: cny, timestamp: Date.now() };
			await persistRate(cny);
		} catch {
			// Network error — use cache or default
			if (!cachedRate) cachedRate = await loadCachedRate();
		}
	})();
	return ratePromise;
}

/**
 * 获取当前汇率（USD → CNY），返回缓存的汇率，异步触发刷新。
 */
export async function refreshExchangeRate(): Promise<number> {
	const cached = await loadCachedRate();
	cachedRate = cached;
	// 后台刷新（不阻塞调用方）
	fetchRateOnce();
	return cachedRate.rate;
}

/**
 * 获取当前汇率（同步，返回缓存值或默认值）
 */
export function getExchangeRate(): number {
	return cachedRate?.rate ?? DEFAULT_RATE;
}

/**
 * locale 感知的成本格式化
 * zh: 按汇率换算为 CNY 并显示 ¥；en: 显示 $。
 */
export function formatCLICost(value: number, digits?: number): string {
	const lang = i18n.getLanguage();
	const isCny = lang === "zh";
	const rate = isCny ? getExchangeRate() : 1;
	const converted = value * rate;
	const symbol = isCny ? "¥" : "$";
	if (converted === 0) return `${symbol}0`;
	const fractionDigits = digits !== undefined ? digits : converted > 0 && converted < 0.01 ? 4 : 2;
	return `${symbol}${converted.toFixed(fractionDigits)}`;
}
