/**
 * Translation seam for tui-package UI strings.
 *
 * The tui package must not depend on the coding-agent i18n runtime (the
 * dependency direction is the other way), so the host application injects a
 * translator at startup. When no translator is registered — tests, SDK
 * embedding, English default — every lookup returns its fallback unchanged,
 * keeping this package behaviorally identical to upstream.
 */

export type TuiTranslator = (key: string, fallback: string, params?: Record<string, unknown>) => string;

function interpolate(template: string, params?: Record<string, unknown>): string {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (match, key) => (params[key] === undefined ? match : String(params[key])));
}

let translator: TuiTranslator | null = null;
let languageProvider: (() => string) | null = null;

/** Register the host translator (pass `null` to restore the English default). */
export function setTuiTranslator(translate: TuiTranslator | null): void {
	translator = translate;
}

/** Register a provider for the active UI language (used to detect runtime switches). */
export function setTuiLanguageProvider(getLanguage: (() => string) | null): void {
	languageProvider = getLanguage;
}

/** True when a host translator is registered and translations may differ from fallbacks. */
export function isTuiTranslationActive(): boolean {
	return translator !== null;
}

/** Resolve a UI string through the host translator, or return the fallback as-is. */
export function tuiT(key: string, fallback: string, params?: Record<string, unknown>): string {
	return translator ? translator(key, fallback, params) : interpolate(fallback, params);
}

/** Active UI language as reported by the host; `"en"` when no host is registered. */
export function tuiLanguage(): string {
	return languageProvider ? languageProvider() : "en";
}
