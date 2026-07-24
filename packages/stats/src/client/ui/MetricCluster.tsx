import {
	formatCompact,
	formatCost,
	formatDurationMs,
	formatInteger,
	formatPercent,
	formatTokensPerSecond,
} from "../data/formatters";
import { sumConversationTokens } from "../data/view-models";
import { useLocale, useTranslation } from "../i18n";
import type { AggregatedStats } from "../types";

export interface MetricClusterProps {
	stats: AggregatedStats;
}

export function MetricCluster({ stats }: MetricClusterProps) {
	const { t } = useTranslation();
	const { locale } = useLocale();
	const conversationTokens = sumConversationTokens(stats);
	return (
		<div className="stats-metric-cluster">
			<div className="stats-metric-primary-grid">
				<div className="stats-metric-card primary">
					<div className="stats-metric-label">{t("metric.totalCost")}</div>
					<div className="stats-metric-value">
						{formatCost(stats.totalCost, stats.totalCost > 0 && stats.totalCost < 0.01 ? 4 : 2, locale)}
					</div>
				</div>
				<div className="stats-metric-card primary">
					<div className="stats-metric-label">{t("metric.requests")}</div>
					<div className="stats-metric-value">{formatInteger(stats.totalRequests)}</div>
				</div>
				<div className="stats-metric-card primary">
					<div className="stats-metric-label">{t("metric.cacheRate")}</div>
					<div className="stats-metric-value">{formatPercent(stats.cacheRate)}</div>
				</div>
				<div className="stats-metric-card primary">
					<div className="stats-metric-label">{t("metric.errorRate")}</div>
					<div className="stats-metric-value">{formatPercent(stats.errorRate)}</div>
				</div>
			</div>

			<div className="stats-metric-secondary-grid">
				<div className="stats-metric-card secondary" title="Conversation input not served from cache">
					<div className="stats-metric-label">{t("metric.inputTokens")}</div>
					<div className="stats-metric-value">{formatCompact(stats.totalInputTokens, locale)}</div>
				</div>
				<div className="stats-metric-card secondary" title="Conversation input read from the prompt cache">
					<div className="stats-metric-label">Cache Read</div>
					<div className="stats-metric-value">{formatCompact(stats.totalCacheReadTokens, locale)}</div>
				</div>
				<div className="stats-metric-card secondary">
					<div className="stats-metric-label">{t("metric.outputTokens")}</div>
					<div className="stats-metric-value">{formatCompact(stats.totalOutputTokens, locale)}</div>
				</div>
				<div className="stats-metric-card secondary" title="Uncached input + cache reads + cache writes + output">
					<div className="stats-metric-label">Conversation Total</div>
					<div className="stats-metric-value">{formatCompact(conversationTokens, locale)}</div>
				</div>
				<div className="stats-metric-card secondary">
					<div className="stats-metric-label">{t("metric.premiumRequests")}</div>
					<div className="stats-metric-value">{formatInteger(stats.totalPremiumRequests)}</div>
				</div>
				<div className="stats-metric-card secondary">
					<div className="stats-metric-label">{t("metric.tokensPerSec")}</div>
					<div className="stats-metric-value">{formatTokensPerSecond(stats.avgTokensPerSecond)}</div>
				</div>
				<div className="stats-metric-card secondary">
					<div className="stats-metric-label">{t("metric.avgLatency")}</div>
					<div className="stats-metric-value">{formatDurationMs(stats.avgDuration)}</div>
				</div>
				<div className="stats-metric-card secondary">
					<div className="stats-metric-label">{t("metric.avgTTFT")}</div>
					<div className="stats-metric-value">{formatDurationMs(stats.avgTtft)}</div>
				</div>
			</div>
		</div>
	);
}
