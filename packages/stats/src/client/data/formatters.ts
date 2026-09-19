import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Locale } from "../i18n";
import { getExchangeRate } from "../useExchangeRate";
import type { MessageStats } from "../types";

export function formatInteger(value: number): string {
	return value.toLocaleString();
}

export function formatCompact(value: number, locale: "en" | "zh" = "en"): string {
	const displayLocale = locale === "zh" ? "zh-CN" : "en-US";
	return value.toLocaleString(displayLocale, { notation: "compact" });
}

export function formatCost(value: number, digits?: number, locale: "en" | "zh" = "en"): string {
	const isCny = locale === "zh";
	const rate = isCny ? getExchangeRate() : 1;
	const converted = value * rate;
	const symbol = isCny ? "¥" : "$";
	if (converted === 0) return `${symbol}0`;
	const fractionDigits = digits !== undefined ? digits : converted > 0 && converted < 0.01 ? 4 : 2;
	return `${symbol}${converted.toLocaleString(undefined, {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	})}`;
}

/** Format an API-equivalent estimate, using N/A when all usage is unpriced. */
export function formatEstimatedCost(value: number, unpricedRequests: number, digits?: number): string {
	return value === 0 && unpricedRequests > 0 ? "N/A" : formatCost(value, digits);
}

/**
 * Format one request's cost, distinguishing unpriced usage from free usage.
 * Mirrors the server's `unpricedRequestSql`: `xai-oauth` is billed through a
 * subscription, and `costUnpriced` marks a row the ingest path could not price
 * (a scheduled card with no recoverable request timestamp).
 */
export function formatMessageCost(
	message: Pick<MessageStats, "provider" | "usage" | "costUnpriced">,
	digits?: number,
): string {
	const unpricedRequests =
		message.usage.totalTokens > 0 &&
		message.usage.cost.total === 0 &&
		(message.provider === "xai-oauth" || message.costUnpriced === true)
			? 1
			: 0;
	return formatEstimatedCost(message.usage.cost.total, unpricedRequests, digits);
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

export function formatTokensPerSecond(value: number | null): string {
	if (value === null) return "-";
	return value.toFixed(1);
}

export function formatRelativeTime(timestamp: number, locale: Locale = "en"): string {
	return formatDistanceToNow(new Date(timestamp), {
		addSuffix: true,
		locale: locale === "zh" ? zhCN : undefined,
	});
}

export function formatBytes(value: number): string {
	if (value >= 1e9) return `${(value / 1e9).toFixed(1)} GB`;
	if (value >= 1e6) return `${(value / 1e6).toFixed(1)} MB`;
	if (value >= 1e3) return `${(value / 1e3).toFixed(1)} KB`;
	return `${value} B`;
}
