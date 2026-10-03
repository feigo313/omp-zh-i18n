import "./models.css";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { getModelDashboardStats } from "../api";
import { type ChartSeries, Legend, Sparkline, TimeChart, useHiddenSeries } from "../charts";
import { buildModelColorLookup, modelKey, OTHER_COLOR } from "../data/colors";
import {
	formatCompact,
	formatDurationMs,
	formatEstimatedCost,
	formatInteger,
	formatPercent,
	formatRelativeTime,
	formatTokensPerSecond,
} from "../data/formatters";
import { useQuery } from "../data/query";
import { bucketAxis, rangeMeta } from "../data/range";
import { densify, pivotSeries } from "../data/series";
import {
	buildModelPerformanceLookup,
	type ModelPerformanceDataPoint,
	sumConversationTokens,
} from "../data/view-models";
import { type Locale, type TranslationFn, useTranslation } from "../i18n";
import type { ModelDashboardStats, ModelStats, TimeRange } from "../types";
import {
	Badge,
	Card,
	ChartSkeleton,
	type Column,
	EmptyState,
	errorRateTone,
	KeyValues,
	LabelCell,
	MeterCell,
	PageHeader,
	QueryView,
	Segmented,
	Skeleton,
	Stat,
	StatGrid,
	Swatch,
	Table,
	TableSkeleton,
} from "../ui";

export interface ModelsRouteProps {
	active: boolean;
	range: TimeRange;
}

type ShareMode = "share" | "requests";

/** Models plotted individually in the share chart; the rest fold into "Other". */
const SHARE_LIMIT = 6;

export function ModelsRoute({ active, range }: ModelsRouteProps) {
	const { t, locale } = useTranslation();
	const query = useQuery(["models", range], () => getModelDashboardStats(range), { enabled: active });
	const meta = rangeMeta(range);
	const [mode, setMode] = useState<ShareMode>("share");
	const [hidden, toggleSeries] = useHiddenSeries();
	const [expandedKey, setExpandedKey] = useState<string | null>(null);
	const view = useMemo(() => (query.data ? buildModelsView(query.data, range) : null), [query.data, range]);
	const bucketWord = bucketName(meta.bucketMs, t);
	const isEmpty = (data: ModelDashboardStats) => data.byModel.length === 0;
	const shareOptions = useMemo(
		() => [
			{ value: "share" as const, label: t("providers.columns.share") },
			{ value: "requests" as const, label: t("common.requests") },
		],
		[t],
	);
	const empty = <EmptyState title={t("models.noUsage")} hint={t("common.hint.widerRange")} />;

	return (
		<div className="page">
			<PageHeader
				title={t("nav.section.models")}
				description={t("models.pageDescription", { window: meta.windowLabel })}
			/>

			<QueryView
				query={query}
				skeleton={<Skeleton height={112} style={{ borderRadius: 12 }} />}
				isEmpty={isEmpty}
				empty={empty}
			>
				{() =>
					view && (
						<div data-stale={query.stale}>
							<StatGrid min={200}>
								<Stat
									label={t("models.stat.modelsUsed")}
									value={formatInteger(view.models.length)}
									hint={t("models.hint.acrossProviders", { count: view.providerCount })}
								/>
								<Stat
									label={t("models.stat.mostUsed")}
									title={view.top ? `${view.top.model} (${view.top.provider})` : undefined}
									value={view.top ? view.top.model : "–"}
									hint={
										view.top
											? t("models.hint.ofRequests", {
													share: formatPercent(view.top.totalRequests / Math.max(1, view.totalRequests)),
													provider: view.top.provider,
												})
											: undefined
									}
								/>
								<Stat
									label={t("common.requests")}
									value={formatInteger(view.totalRequests)}
									hint={t("common.failedCount", { count: formatInteger(view.failedRequests) })}
									spark={view.requestTotals}
								/>
								<Stat
									label={t("costs.apiEquivalent")}
									title={t("common.costTooltip")}
									value={formatEstimatedCost(view.totalCost, view.unpricedRequests)}
									hint={
										view.unpricedRequests > 0
											? t("common.unpricedCount", { count: formatInteger(view.unpricedRequests) })
											: undefined
									}
								/>
							</StatGrid>
						</div>
					)
				}
			</QueryView>

			<Card
				index={1}
				title={t("models.requestShare")}
				description={
					mode === "share"
						? t("models.sharePerBucket", { bucket: bucketWord })
						: t("models.countPerBucket", { bucket: bucketWord })
				}
				actions={
					<Segmented
						size="sm"
						options={shareOptions}
						value={mode}
						onChange={setMode}
						aria-label={t("models.shareMode")}
					/>
				}
				stale={query.stale}
			>
				<QueryView query={query} skeleton={<ChartSkeleton height={260} />} isEmpty={isEmpty} empty={empty}>
					{() =>
						view && (
							<div className="stack" style={{ gap: 12 }}>
								<TimeChart
									buckets={view.buckets}
									bucketMs={meta.bucketMs}
									series={mode === "share" ? view.shareSeries : view.countSeries}
									hidden={hidden}
									height={260}
									yMax={mode === "share" ? 1 : undefined}
									format={mode === "share" ? v => formatPercent(v, 0) : v => formatCompact(v, locale)}
									formatTooltip={mode === "share" ? v => formatPercent(v) : formatInteger}
									showTotal={mode === "requests"}
								/>
								<Legend
									items={view.countSeries.map(s => ({
										key: s.key,
										label: s.label,
										color: s.color,
										value: formatPercent(sumValues(s.values) / Math.max(1, sumValues(view.requestTotals))),
									}))}
									hidden={hidden}
									onToggle={toggleSeries}
								/>
							</div>
						)
					}
				</QueryView>
			</Card>

			<Card
				index={2}
				title={t("requests.filterAllModels")}
				description={t("models.allModelsDescription")}
				stale={query.stale}
				flush
			>
				<QueryView query={query} skeleton={<TableSkeleton rows={8} />} isEmpty={isEmpty} empty={empty}>
					{() =>
						view && (
							<Table
								rows={view.models}
								rowKey={row => modelKey(row.model, row.provider)}
								columns={buildModelColumns(view, expandedKey, bucketWord, t, locale)}
								initialSort={{ key: "requests", dir: "desc" }}
								limit={25}
								onRowClick={row => {
									const key = modelKey(row.model, row.provider);
									setExpandedKey(prev => (prev === key ? null : key));
								}}
								selectedKey={expandedKey}
								expanded={row => {
									const key = modelKey(row.model, row.provider);
									return key === expandedKey ? (
										<ModelDetail
											model={row}
											color={view.swatches.get(key) ?? "var(--chart-primary)"}
											points={view.performance.get(key) ?? []}
											bucketMs={meta.bucketMs}
											bucketWord={bucketWord}
										/>
									) : null;
								}}
							/>
						)
					}
				</QueryView>
			</Card>
		</div>
	);
}

interface ModelsView {
	models: ModelStats[];
	top: ModelStats | undefined;
	/** Chart color of each individually plotted model; the rest share "Other" gray. */
	swatches: Map<string, string>;
	labels: Map<string, string>;
	providerCount: number;
	totalRequests: number;
	failedRequests: number;
	totalCost: number;
	unpricedRequests: number;
	maxRequests: number;
	buckets: number[];
	requestTotals: number[];
	/** Top-N + Other requests per bucket (stacked counts). */
	countSeries: ChartSeries[];
	/** `countSeries` as a fraction of each bucket's total. */
	shareSeries: ChartSeries[];
	/** Dense requests per bucket for every model, for the table sparkline. */
	trends: Map<string, readonly (number | null)[]>;
	performance: Map<string, ModelPerformanceDataPoint[]>;
}

function buildModelsView(data: ModelDashboardStats, range: TimeRange): ModelsView {
	const models = data.byModel;
	const colors = buildModelColorLookup(models);
	const labels = modelLabels(models);
	const buckets = bucketAxis(
		range,
		data.modelSeries.map(p => p.timestamp),
	);
	const requestTotals = densify(data.modelSeries, buckets, p => p.requests);
	const pivot = {
		buckets,
		key: (p: { model: string; provider: string }) => modelKey(p.model, p.provider),
		label: (key: string) => labels.get(key) ?? key,
		value: (p: { requests: number }) => p.requests,
		colors,
	};
	// Zero slots become gaps so tooltips list only the models active in that bucket.
	const countSeries = pivotSeries(data.modelSeries, { ...pivot, limit: SHARE_LIMIT }).map(s => ({
		...s,
		values: s.values.map(v => v || null),
	}));
	const shareSeries = countSeries.map(s => ({
		...s,
		values: s.values.map((v, i) => (v === null ? null : v / requestTotals[i])),
	}));
	const trends = new Map(pivotSeries(data.modelSeries, pivot).map(s => [s.key, s.values]));

	let top: ModelStats | undefined;
	let totalRequests = 0;
	let failedRequests = 0;
	let totalCost = 0;
	let unpricedRequests = 0;
	for (const m of models) {
		if (!top || m.totalRequests > top.totalRequests) top = m;
		totalRequests += m.totalRequests;
		failedRequests += m.failedRequests;
		totalCost += m.totalCost;
		unpricedRequests += m.unpricedRequests;
	}

	return {
		models,
		top,
		swatches: new Map(countSeries.filter(s => s.key !== "__other__").map(s => [s.key, s.color])),
		labels,
		providerCount: new Set(models.map(m => m.provider)).size,
		totalRequests,
		failedRequests,
		totalCost,
		unpricedRequests,
		maxRequests: top?.totalRequests ?? 0,
		buckets,
		requestTotals,
		countSeries,
		shareSeries,
		trends,
		performance: buildModelPerformanceLookup(data.modelPerformanceSeries),
	};
}

/** Model name, qualified by provider only when the same model id is served by several. */
function modelLabels(models: readonly ModelStats[]): Map<string, string> {
	const providersPerModel = new Map<string, number>();
	for (const m of models) providersPerModel.set(m.model, (providersPerModel.get(m.model) ?? 0) + 1);
	return new Map(
		models.map(m => [
			modelKey(m.model, m.provider),
			(providersPerModel.get(m.model) ?? 0) > 1 ? `${m.model} · ${m.provider}` : m.model,
		]),
	);
}

function buildModelColumns(
	view: ModelsView,
	expandedKey: string | null,
	bucketWord: string,
	t: TranslationFn,
	locale: Locale,
): Column<ModelStats>[] {
	return [
		{
			key: "expand",
			header: "",
			width: 28,
			render: row => (
				<span className="models-chevron" data-open={modelKey(row.model, row.provider) === expandedKey}>
					<ChevronRight size={14} />
				</span>
			),
		},
		{
			key: "model",
			header: t("common.model"),
			sort: row => row.model,
			render: row => (
				<LabelCell
					lead={<Swatch color={view.swatches.get(modelKey(row.model, row.provider)) ?? OTHER_COLOR} />}
					primary={<span className="mono">{row.model}</span>}
					secondary={row.provider}
				/>
			),
		},
		{
			key: "requests",
			header: t("common.requests"),
			align: "right",
			sort: row => row.totalRequests,
			render: row => (
				<MeterCell
					value={row.totalRequests}
					max={view.maxRequests}
					display={formatInteger(row.totalRequests)}
					color={view.swatches.get(modelKey(row.model, row.provider)) ?? OTHER_COLOR}
				/>
			),
		},
		{
			key: "cost",
			header: t("common.cost"),
			title: t("costs.title.apiEquivalentAtPublicRates"),
			align: "right",
			sort: row => row.totalCost,
			render: row => <span className="num">{formatEstimatedCost(row.totalCost, row.unpricedRequests)}</span>,
		},
		{
			key: "tokens",
			header: t("common.tokens"),
			title: t("common.tokenMixTooltip"),
			align: "right",
			sort: row => sumConversationTokens(row),
			render: row => {
				const tokens = sumConversationTokens(row);
				return (
					<span className="num" title={formatInteger(tokens)}>
						{formatCompact(tokens, locale)}
					</span>
				);
			},
		},
		{
			key: "cache",
			header: t("common.cacheRate"),
			title: t("common.cacheRateTooltip"),
			align: "right",
			sort: row => row.cacheRate,
			render: row => <span className="num">{formatPercent(row.cacheRate)}</span>,
		},
		{
			key: "errors",
			header: t("common.errors"),
			align: "right",
			sort: row => row.errorRate,
			render: row =>
				row.failedRequests === 0 ? (
					<span className="num dim">0%</span>
				) : (
					<span title={t("common.failedCount", { count: formatInteger(row.failedRequests) })}>
						<Badge tone={errorRateTone(row.errorRate)} mono>
							{formatPercent(row.errorRate)}
						</Badge>
					</span>
				),
		},
		{
			key: "tps",
			header: t("common.tokensPerSec"),
			title: t("models.title.avgThroughput"),
			align: "right",
			sort: row => row.avgTokensPerSecond ?? -1,
			render: row => <span className="num">{formatTokensPerSecond(row.avgTokensPerSecond)}</span>,
		},
		{
			key: "ttft",
			header: t("detail.ttft"),
			title: t("models.title.avgTtft"),
			align: "right",
			sort: row => row.avgTtft ?? -1,
			render: row => <span className="num">{formatDurationMs(row.avgTtft)}</span>,
		},
		{
			key: "trend",
			header: t("models.trend"),
			title: t("common.tooltip.requestsPerBucket", { bucket: bucketWord }),
			width: 112,
			render: row => {
				const key = modelKey(row.model, row.provider);
				const values = view.trends.get(key);
				return values ? (
					<Sparkline
						values={values.map(v => v ?? 0)}
						color={view.swatches.get(key) ?? OTHER_COLOR}
						width={96}
						height={22}
					/>
				) : (
					<span className="dim">–</span>
				);
			},
		},
	];
}

function ModelDetail({
	model,
	color,
	points,
	bucketMs,
	bucketWord,
}: {
	model: ModelStats;
	color: string;
	points: readonly ModelPerformanceDataPoint[];
	bucketMs: number;
	bucketWord: string;
}) {
	const { t, locale } = useTranslation();
	const [hidden, toggle] = useHiddenSeries();
	const series: ChartSeries[] = [
		{
			key: "tps",
			label: t("common.tokensPerSec"),
			color,
			kind: points.length > 1 ? "line" : "bars",
			values: points.map(p => p.avgTokensPerSecond),
		},
		{
			key: "ttft",
			label: t("detail.ttft"),
			color: OTHER_COLOR,
			kind: points.length > 1 ? "line" : "bars",
			axis: "right",
			dashed: true,
			values: points.map(p => p.avgTtftSeconds),
		},
	];

	return (
		<div className="models-detail">
			<div className="models-detail-facts">
				<div>
					<div className="section-label">{t("common.efficiency")}</div>
					<KeyValues
						items={[
							{
								key: "err",
								label: t("models.errorRate"),
								value: (
									<span className={`tone-${errorRateTone(model.errorRate)}`}>
										{formatPercent(model.errorRate)}{" "}
										<span className="dim">
											({t("common.failedCount", { count: formatInteger(model.failedRequests) })})
										</span>
									</span>
								),
							},
							{ key: "cache", label: t("common.cacheRate"), value: formatPercent(model.cacheRate) },
							{
								key: "savings",
								label: t("common.cacheSavings"),
								value: (
									<span className={model.cacheSavings < 0 ? "tone-bad" : undefined}>
										{formatPercent(model.cacheSavings)}
									</span>
								),
							},
							{
								key: "premium",
								label: t("metric.premiumRequests"),
								value: formatInteger(Math.round(model.totalPremiumRequests * 100) / 100),
							},
						]}
					/>
				</div>
				<div>
					<div className="section-label">{t("models.latency")}</div>
					<KeyValues
						items={[
							{ key: "dur", label: t("models.avgDuration"), value: formatDurationMs(model.avgDuration) },
							{ key: "ttft", label: t("models.avgTTFT"), value: formatDurationMs(model.avgTtft) },
							{
								key: "tps",
								label: t("common.tokensPerSec"),
								value: formatTokensPerSecond(model.avgTokensPerSecond),
							},
						]}
					/>
				</div>
				<div>
					<div className="section-label">{t("common.tokens")}</div>
					<KeyValues
						items={[
							{
								key: "in",
								label: t("common.uncachedInput"),
								value: formatCompact(model.totalInputTokens, locale),
							},
							{
								key: "cr",
								label: t("common.cacheRead"),
								value: formatCompact(model.totalCacheReadTokens, locale),
							},
							{
								key: "cw",
								label: t("common.cacheWrite"),
								value: formatCompact(model.totalCacheWriteTokens, locale),
							},
							{ key: "out", label: t("common.output"), value: formatCompact(model.totalOutputTokens, locale) },
						]}
					/>
				</div>
				<div className="micro dim">
					{t("models.firstLastSeen", {
						first: formatRelativeTime(model.firstTimestamp, locale),
						last: formatRelativeTime(model.lastTimestamp, locale),
					})}
				</div>
			</div>
			<div className="models-detail-chart">
				<div className="row" style={{ justifyContent: "space-between" }}>
					<div className="section-label" style={{ marginBottom: 0 }}>
						{t("models.performancePerBucket", { bucket: bucketWord })}
					</div>
					<Legend
						items={series.map(s => ({ key: s.key, label: s.label, color: s.color }))}
						hidden={hidden}
						onToggle={toggle}
					/>
				</div>
				{points.length === 0 ? (
					<EmptyState title={t("models.noPerformance")} hint={t("models.noPerformanceHint")} />
				) : (
					<TimeChart
						buckets={points.map(p => p.timestamp)}
						bucketMs={bucketMs}
						series={series}
						hidden={hidden}
						stacked={false}
						height={240}
						format={v => formatCompact(v, locale)}
						formatTooltip={v => `${formatTokensPerSecond(v)} ${t("common.tokensPerSec")}`}
						formatRight={v => `${Number(v.toFixed(2))}s`}
						tooltipExtra={i => (
							<div className="chart-tooltip-row chart-tooltip-total">
								<span className="chart-tooltip-label">{t("common.requests")}</span>
								<span className="chart-tooltip-value">{formatInteger(points[i].requests)}</span>
							</div>
						)}
					/>
				)}
			</div>
		</div>
	);
}

function bucketName(bucketMs: number, t: TranslationFn): string {
	if (bucketMs < 3_600_000) return t("common.bucket.5minutes");
	if (bucketMs < 86_400_000) return t("common.bucket.hour");
	return t("common.bucket.day");
}

function sumValues(values: readonly (number | null)[]): number {
	let total = 0;
	for (const v of values) total += v ?? 0;
	return total;
}
