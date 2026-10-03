import { format, formatDistanceToNow } from "@oh-my-pi/pi-utils/dates";
import type { Locale } from "../i18n";
import { getExchangeRate } from "../useExchangeRate";
import type { MessageStats } from "../types";

/**
 * Every number on the dashboard uses one fixed locale. Labels, percents
 * (`toFixed`), durations and dates are English, so following the browser
 * locale mixed conventions (e.g. `1,4 Mr` beside `97.0%` on a tr-TR browser).
 */
const NUMBER_LOCALE = "en-US";

export function formatInteger(value: number): string {
	return value.toLocaleString(NUMBER_LOCALE);
}

export function formatCompact(value: number, locale: Locale = "en"): string {
	return value.toLocaleString(locale === "zh" ? "zh-CN" : NUMBER_LOCALE, { notation: "compact" });
}

export function formatCost(value: number, digits?: number, locale: Locale = "en"): string {
	const isCny = locale === "zh";
	const symbol = isCny ? "¥" : "$";
	const converted = isCny ? value * getExchangeRate() : value;
	if (converted === 0) return `${symbol}0`;
	const fractionDigits = digits !== undefined ? digits : converted > 0 && converted < 0.01 ? 4 : 2;
	return `${symbol}${converted.toLocaleString(locale === "zh" ? "zh-CN" : NUMBER_LOCALE, {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	})}`;
}

/** Format an API-equivalent estimate, using N/A when all usage is unpriced. */
export function formatEstimatedCost(value: number, unpricedRequests: number, digits?: number): string {
	return value === 0 && unpricedRequests > 0 ? "N/A" : formatCost(value, digits);
}

/**
 * Whether one request's zero cost means unknown spend rather than free usage.
 * Mirrors the server's `unpricedRequestSql`: `xai-oauth` is billed through a
 * subscription, and `costUnpriced` marks a row the ingest path could not price
 * (a scheduled card with no recoverable request timestamp).
 */
export function isUnpricedMessage(message: Pick<MessageStats, "provider" | "usage" | "costUnpriced">): boolean {
	return (
		message.usage.totalTokens > 0 &&
		message.usage.cost.total === 0 &&
		(message.provider === "xai-oauth" || message.costUnpriced === true)
	);
}

/** Format one request's cost, distinguishing unpriced usage from free usage. */
export function formatMessageCost(
	message: Pick<MessageStats, "provider" | "usage" | "costUnpriced">,
	digits?: number,
): string {
	return formatEstimatedCost(message.usage.cost.total, isUnpricedMessage(message) ? 1 : 0, digits);
}

export function formatPercent(value: number, digits = 1): string {
	return `${(value * 100).toFixed(digits)}%`;
}

export function formatDurationMs(value: number | null, digits?: number): string {
	if (value === null) return "-";
	const sec = value / 1000;
	const d = digits !== undefined ? digits : sec < 1 ? 2 : 1;
	return `${sec.toFixed(d)}s`;
}

/** Wall-clock length: seconds below a minute, then `17m 41s` / `2h 05m`. */
export function formatElapsed(ms: number): string {
	if (ms < 60_000) return formatDurationMs(ms);
	const totalMin = Math.floor(ms / 60_000);
	if (totalMin < 60) return `${totalMin}m ${String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0")}s`;
	return `${Math.floor(totalMin / 60)}h ${String(totalMin % 60).padStart(2, "0")}m`;
}

export function formatTokensPerSecond(value: number | null): string {
	if (value === null) return "-";
	return value.toFixed(1);
}

/** Relative-time ladder for the Chinese formatter, largest unit first. */
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	["year", 31_536_000_000],
	["month", 2_592_000_000],
	["week", 604_800_000],
	["day", 86_400_000],
	["hour", 3_600_000],
	["minute", 60_000],
	["second", 1_000],
];

/**
 * Chinese relative time. `pi-utils/dates` only ships English words, so the
 * localized wording comes from `Intl` — no Chinese literals live in this file.
 */
function formatRelativeTimeZh(timestamp: number): string {
	const rtf = new Intl.RelativeTimeFormat("zh-CN", { numeric: "always" });
	const deltaMs = timestamp - Date.now();
	const absMs = Math.abs(deltaMs);
	for (const [unit, ms] of RELATIVE_UNITS) {
		if (absMs >= ms) return rtf.format(Math.round(deltaMs / ms), unit);
	}
	return rtf.format(Math.round(deltaMs / 1_000), "second");
}

export function formatRelativeTime(timestamp: number, locale: Locale = "en"): string {
	if (locale === "zh") return formatRelativeTimeZh(timestamp);
	return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/** Absolute local date and time to the second ("Sep 28, 14:03:22"). */
export function formatTimestamp(timestamp: number): string {
	return format(new Date(timestamp), "MMM d, HH:mm:ss");
}

/** Project folder as stored by ingest (`/work-pi/`), without the slashes. */
export function formatFolder(folder: string): string {
	return folder.replace(/^\/+|\/+$/g, "") || "(root)";
}

export function formatBytes(value: number): string {
	if (value >= 1e9) return `${(value / 1e9).toFixed(1)} GB`;
	if (value >= 1e6) return `${(value / 1e6).toFixed(1)} MB`;
	if (value >= 1e3) return `${(value / 1e3).toFixed(1)} KB`;
	return `${value} B`;
}
