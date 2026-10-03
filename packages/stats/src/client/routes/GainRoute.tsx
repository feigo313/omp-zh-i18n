import { useMemo, useState } from "react";
import { getGainDashboardStats } from "../api";
import { Chart, type ChartSeries, Legend } from "../charts";
import { formatBytes, formatCompact, formatInteger, formatPercent } from "../data/formatters";
import { useQuery } from "../data/query";
import { bucketAxis, rangeMeta } from "../data/range";
import { densify } from "../data/series";
import { useTranslation } from "../i18n";
import type { GainSource, GainSourceTotals, TimeRange } from "../types";
import {
	Card,
	ChartSkeleton,
	type Column,
	EmptyState,
	MeterCell,
	PageHeader,
	QueryView,
	Stat,
	StatGrid,
	Table,
} from "../ui";

export interface GainRouteProps {
	active: boolean;
	range: TimeRange;
}

const DAY_MS = 86_400_000;

const SOURCE_LABEL: Record<GainSource, string> = { snapcompact: "Snapcompact" };

/** The server buckets gain by UTC calendar day (`YYYY-MM-DD`). */
const DAY_LABEL = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

interface SourceRow extends GainSourceTotals {
	source: GainSource;
	/** Share of all saved tokens (0-1). */
	share: number;
}

export function GainRoute({ active, range }: GainRouteProps) {
	const { t, locale } = useTranslation();
	const [project, setProject] = useState<string | null>(null);
	const gain = useQuery(["gain", range, project], () => getGainDashboardStats(range, project), { enabled: active });
	const meta = rangeMeta(range);
	const data = gain.data;

	const series = useMemo(() => {
		const points = (data?.timeSeries ?? []).map(p => ({ ...p, timestamp: Date.parse(`${p.date}T00:00:00Z`) }));
		const buckets = bucketAxis(
			range,
			points.map(p => p.timestamp),
			DAY_MS,
		);
		const daily = densify(points, buckets, p => p.snapcompact);
		let running = 0;
		const cumulative = daily.map(v => (running += v));
		return { buckets, daily, cumulative };
	}, [data, range]);

	const sourceRows = useMemo((): SourceRow[] => {
		if (!data) return [];
		const total = data.overall.savedTokens;
		return (Object.keys(data.bySource) as GainSource[]).map(source => ({
			...data.bySource[source],
			source,
			share: total > 0 ? data.bySource[source].savedTokens / total : 0,
		}));
	}, [data]);

	const projects = data?.projects ?? [];
	// Keep the chosen project selectable even when the current range never saw it.
	const projectOptions = project !== null && !projects.includes(project) ? [project, ...projects] : projects;
	const scope = project ? t("gain.scopeFor", { project }) : "";

	const chartSeries: ChartSeries[] = [
		{ key: "daily", label: t("gain.savedPerDay"), color: "var(--chart-primary)", values: series.daily },
		{
			key: "cumulative",
			label: t("gain.cumulative"),
			color: "var(--chart-secondary)",
			values: series.cumulative,
			kind: "line",
			axis: "right",
		},
	];

	// Upstream hoists these to module scope; they live in the component so the
	// localized headers can reach `t` without changing the table's sort contract.
	const sourceColumns = useMemo<Column<SourceRow>[]>(
		() => [
			{
				key: "source",
				header: t("gain.bySource.title"),
				sort: row => row.source,
				render: row => <span className="cell-primary">{SOURCE_LABEL[row.source]}</span>,
			},
			{
				key: "tokens",
				header: t("gain.savedTokens"),
				align: "right",
				sort: row => row.savedTokens,
				render: row => (
					<span title={formatInteger(row.savedTokens)}>
						<MeterCell value={row.share} max={1} display={formatCompact(row.savedTokens, locale)} />
					</span>
				),
			},
			{
				key: "share",
				header: t("providers.columns.share"),
				align: "right",
				sort: row => row.share,
				render: row => <span className="num muted">{formatPercent(row.share)}</span>,
			},
			{
				key: "bytes",
				header: t("gain.savedBytes"),
				align: "right",
				sort: row => row.savedBytes,
				render: row => <span className="num">{formatBytes(row.savedBytes)}</span>,
			},
			{
				key: "hits",
				header: t("gain.hits"),
				align: "right",
				sort: row => row.hits,
				render: row => <span className="num">{formatInteger(row.hits)}</span>,
			},
			{
				key: "reduction",
				header: t("gain.reduction"),
				align: "right",
				sort: row => row.reductionPercent ?? -1,
				render: row => (
					<span className="num">{row.reductionPercent !== null ? formatPercent(row.reductionPercent) : "–"}</span>
				),
			},
		],
		[t, locale],
	);

	return (
		<div className="page">
			<PageHeader
				title={t("nav.section.gain")}
				description={t("gain.pageDescription", { scope, window: meta.windowLabel })}
				actions={
					projectOptions.length > 0 && (
						<select
							className="input"
							aria-label={t("gain.project")}
							value={project ?? ""}
							onChange={e => setProject(e.target.value || null)}
							style={{ maxWidth: 320 }}
						>
							<option value="">{t("gain.allProjects")}</option>
							{projectOptions.map(p => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
					)
				}
			/>

			<QueryView
				query={gain}
				skeleton={<ChartSkeleton height={96} />}
				isEmpty={stats => stats.overall.hits === 0 && stats.timeSeries.length === 0}
				empty={
					<Card>
						<EmptyState
							title={t("gain.noSavings", { scope, window: meta.windowLabel })}
							hint={range === "all" ? t("gain.noSavingsHintAll") : t("common.hint.tryLongerRange")}
						/>
					</Card>
				}
			>
				{({ overall }) => (
					<>
						<div data-stale={gain.stale}>
							<StatGrid min={180}>
								<Stat
									label={t("gain.savedTokens")}
									value={formatCompact(overall.savedTokens, locale)}
									hint={formatInteger(overall.savedTokens)}
									spark={series.daily}
								/>
								<Stat label={t("gain.savedBytes")} value={formatBytes(overall.savedBytes)} />
								<Stat
									label={t("gain.reduction")}
									title={t("gain.title.reduction")}
									value={overall.reductionPercent !== null ? formatPercent(overall.reductionPercent) : "–"}
									hint={overall.reductionPercent === null ? t("gain.hint.originalUnknown") : undefined}
								/>
								<Stat label={t("gain.hits")} value={formatInteger(overall.hits)} />
								<Stat
									label={t("gain.savedPerHit")}
									value={overall.hits > 0 ? formatCompact(overall.savedTokens / overall.hits, locale) : "–"}
									hint={t("common.hint.tokens")}
								/>
							</StatGrid>
						</div>

						<Card
							index={1}
							title={t("gain.timeSeries.title")}
							description={t("gain.timeSeries.subtitle")}
							actions={<Legend items={chartSeries.map(s => ({ key: s.key, label: s.label, color: s.color }))} />}
							stale={gain.stale}
						>
							<Chart
								slots={series.buckets.length}
								tickLabel={i => DAY_LABEL.format(series.buckets[i])}
								series={chartSeries}
								height={260}
								formatTooltip={formatInteger}
								formatRight={v => formatCompact(v, locale)}
							/>
						</Card>

						<Card
							index={2}
							title={t("gain.bySource.title")}
							description={t("gain.bySource.subtitle")}
							flush
							stale={gain.stale}
						>
							<Table rows={sourceRows} rowKey={row => row.source} columns={sourceColumns} />
						</Card>
					</>
				)}
			</QueryView>
		</div>
	);
}
