import {
	formatCompact,
	formatDurationMs,
	formatEstimatedCost,
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
					<div className="stats-metric-label">{t("costs.apiEquivalent")}</div>
					<div className="stats-metric-value">
						{formatEstimatedCost(
							stats.totalCost,
							stats.unpricedRequests,
							stats.totalCost > 0 && stats.totalCost < 0.01 ? 4 : 2,
						)}
					</div>
				</div>
				<div className="stats-metric-card primary">
					<div className="stats-metric-label">{t("metric.requests")}</div>
					<div className="stats-metric-value">{formatInteger(stats.totalRequests)}</div>
				</div>
				<div
					className="stats-metric-card primary"
					title="Prompt-input cost saved versus billing the same tokens uncached; cache writes can make this negative"
				>
					<div className="stats-metric-label">{t("common.cacheSavings")}</div>
					<div className="stats-metric-value">{formatPercent(stats.cacheSavings)}</div>
				</div>
				<div
					className="stats-metric-card primary"
					title="Prompt input served from cache: cache reads / (uncached input + cache reads)"
				>
					<div className="stats-metric-label">{t("common.cacheRate")}</div>
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
					<div className="stats-metric-label">{t("common.cacheRead")}</div>
					<div className="stats-metric-value">{formatCompact(stats.totalCacheReadTokens, locale)}</div>
				</div>
				<div className="stats-metric-card secondary">
					<div className="stats-metric-label">{t("metric.outputTokens")}</div>
					<div className="stats-metric-value">{formatCompact(stats.totalOutputTokens, locale)}</div>
				</div>
				<div className="stats-metric-card secondary" title="Uncached input + cache reads + cache writes + output">
					<div className="stats-metric-label">{t("common.conversationTotal")}</div>
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
