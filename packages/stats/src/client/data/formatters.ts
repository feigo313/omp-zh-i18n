import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Locale } from "../i18n";
import { getExchangeRate } from "../useExchangeRate";

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
