import { useMemo } from "react";
import { formatCompact, formatInteger, formatPercent } from "../data/formatters";
import { buildAgentTokenShare } from "../data/view-models";
import { type TranslationFn, useLocale } from "../i18n";
import type { AgentType, AgentTypeStats } from "../types";

/**
 * Per-agent-type display chrome. Colors follow the OMP brand palette
 * (pink -> violet -> cyan) used by the dashboard charts so the bar reads on
 * both themes without per-theme overrides.
 */
const AGENT_COLORS: Record<AgentType, string> = {
	main: "#ed4abf",
	subagent: "#9b4dff",
	advisor: "#5ad8e6",
};

const AGENT_LABEL_KEYS: Record<AgentType, string> = {
	main: "agent.main",
	subagent: "agent.subagent",
	advisor: "agent.advisor",
};

export interface AgentTokenShareProps {
	stats: AgentTypeStats[];
	t: TranslationFn;
}

export function AgentTokenShare({ stats, t }: AgentTokenShareProps) {
	const { locale } = useLocale();
	const view = useMemo(() => buildAgentTokenShare(stats), [stats]);

	if (view.totalTokens === 0) {
		return <div className="py-8 text-center stats-text-muted text-sm">{t("agent.noTokenUsage")}</div>;
	}

	return (
		<div className="space-y-4">
			<div className="flex h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
				{view.segments.map(
					seg =>
						seg.share > 0 && (
							<div
								key={seg.agentType}
								className="h-full"
								style={{ width: `${seg.share * 100}%`, background: AGENT_COLORS[seg.agentType] }}
								title={`${t(AGENT_LABEL_KEYS[seg.agentType])}: ${formatPercent(seg.share)}`}
							/>
						),
				)}
			</div>

			<div className="space-y-2">
				{view.segments.map(seg => (
					<div key={seg.agentType} className="flex items-center justify-between gap-3 text-sm">
						<div className="flex items-center gap-2 min-w-0">
							<span
								className="w-2.5 h-2.5 rounded-full flex-shrink-0"
								style={{ background: AGENT_COLORS[seg.agentType] }}
							/>
							<span className="stats-text-primary truncate">{t(AGENT_LABEL_KEYS[seg.agentType])}</span>
							<span className="stats-text-muted stats-text-xs whitespace-nowrap">
								{formatInteger(seg.requests)} req
							</span>
						</div>
						<div className="flex items-center gap-3 whitespace-nowrap">
							<span className="stats-text-secondary">{formatCompact(seg.tokens, locale)} tok</span>
							<span className="stats-font-semibold stats-text-primary tabular-nums">
								{formatPercent(seg.share)}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
