import "./costs.css";
import { useMemo, useState } from "react";
import { getCostDashboardStats } from "../api";
import { Chart, type ChartSeries, Legend, ShareBar, useHiddenSeries } from "../charts";
import { buildModelColorLookup, modelKey, OTHER_COLOR, SERIES_COLORS } from "../data/colors";
import { formatCost, formatEstimatedCost, formatInteger, formatPercent } from "../data/formatters";
import { useQuery } from "../data/query";
import { bucketAxis, rangeMeta } from "../data/range";
import { densify, pivotSeries } from "../data/series";
import { buildCostSummary, type CostComponents, type CostModelRow, type CostSummaryView } from "../data/view-models";
import { type Locale, type TranslationFn, useTranslation } from "../i18n";
import type { CostDashboardStats, TimeRange } from "../types";
import {
	Card,
	ChartSkeleton,
	type Column,
	EmptyState,
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

export interface CostsRouteProps {
	active: boolean;
	range: TimeRange;
}

type SplitMode = "model" | "component";

/** Models stacked individually in the daily chart; the rest fold into "Other". */
const MODEL_LIMIT = 6;

/** The cost series is bucketed by UTC day on the server. */
const DAY_MS = 86_400_000;

interface CostComponent {
	key: keyof CostComponents;
	label: string;
	color: string;
}

/** Billing components, labeled through the dashboard translator. */
function components(t: TranslationFn): readonly CostComponent[] {
	return [
		{ key: "costInput", label: t("common.input"), color: "#5b8cff" },
		{ key: "costOutput", label: t("common.output"), color: "var(--chart-secondary)" },
		{ key: "costCacheRead", label: t("common.cacheRead"), color: "var(--chart-primary)" },
		{ key: "costCacheWrite", label: t("common.cacheWrite"), color: "#f5b54a" },
	];
}

const UTC_DAY = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
const UTC_DAY_LONG = new Intl.DateTimeFormat(undefined, {
	weekday: "short",
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC",
});

export function CostsRoute({ active, range }: CostsRouteProps) {
	const { t, locale } = useTranslation();
	const query = useQuery(["costs", range], () => getCostDashboardStats(range), { enabled: active });
	const meta = rangeMeta(range);
	const [split, setSplit] = useState<SplitMode>("model");
	const [hidden, toggleSeries] = useHiddenSeries();
	const view = useMemo(() => (query.data ? buildCostsView(query.data, range, t) : null), [query.data, range, t]);
	const isEmpty = (data: CostDashboardStats) => data.costSeries.length === 0;
	const empty = <EmptyState title={t("costs.noData")} hint={t("common.hint.widerRange")} />;
	const splitOptions = useMemo(
		() => [
			{ value: "model" as const, label: t("costs.byModel") },
			{ value: "component" as const, label: t("costs.byComponent") },
		],
		[t],
	);

	return (
		<div className="page">
			<PageHeader
				title={t("nav.section.costs")}
				description={t("costs.pageDescription", { window: meta.windowLabel })}
			/>

			<QueryView
				query={query}
				skeleton={<Skeleton height={112} style={{ borderRadius: 12 }} />}
				isEmpty={isEmpty}
				empty={empty}
			>
				{() => view && <CostStats view={view} stale={query.stale} locale={locale} />}
			</QueryView>

			<div className="grid grid-main-side">
				<Card
					index={1}
					title={t("costs.dailyCost")}
					description={split === "model" ? t("costs.dailyCostModel") : t("costs.dailyCostComponent")}
					actions={
						<Segmented
							size="sm"
							options={splitOptions}
							value={split}
							onChange={setSplit}
							aria-label={t("costs.splitBy")}
						/>
					}
					stale={query.stale}
				>
					<QueryView query={query} skeleton={<ChartSkeleton height={280} />} isEmpty={isEmpty} empty={empty}>
						{() => {
							if (!view) return null;
							const series = split === "model" ? view.modelSeries : view.componentSeries;
							return (
								<div className="stack" style={{ gap: 12 }}>
									<Chart
										slots={view.buckets.length}
										tickLabel={i => UTC_DAY.format(view.buckets[i])}
										tooltipTitle={i => UTC_DAY_LONG.format(view.buckets[i])}
										series={series}
										hidden={hidden}
										height={280}
										format={v => formatCost(v, Number.isInteger(v) ? 0 : 2, locale)}
										formatTooltip={v => formatCost(v, undefined, locale)}
										emptyLabel={t("costs.noPricedUsage")}
										tooltipExtra={i =>
											view.unpricedPerDay[i] > 0 ? (
												<div className="chart-tooltip-row chart-tooltip-total">
													<span className="chart-tooltip-label">{t("costs.unpricedRequests")}</span>
													<span className="chart-tooltip-value">
														{formatInteger(view.unpricedPerDay[i])}
													</span>
												</div>
											) : null
										}
									/>
									<Legend
										items={series.map(s => ({
											key: s.key,
											label: s.label,
											color: s.color,
											value: formatCost(sum(s.values), undefined, locale),
										}))}
										hidden={hidden}
										onToggle={toggleSeries}
									/>
								</div>
							);
						}}
					</QueryView>
				</Card>

				<Card
					index={2}
					title={t("costs.whereItWent")}
					description={t("costs.byComponentDescription")}
					stale={query.stale}
				>
					<QueryView query={query} skeleton={<ChartSkeleton height={280} />} isEmpty={isEmpty} empty={empty}>
						{() => view && <ComponentBreakdown summary={view.summary} locale={locale} />}
					</QueryView>
				</Card>
			</div>

			<Card
				index={3}
				title={t("costs.byModel")}
				description={t("costs.perModelDescription")}
				stale={query.stale}
				flush
			>
				<QueryView query={query} skeleton={<TableSkeleton rows={8} />} isEmpty={isEmpty} empty={empty}>
					{() =>
						view && (
							<Table
								rows={view.summary.models}
								rowKey={row => row.key}
								columns={buildCostColumns(view, t, locale)}
								initialSort={{ key: "cost", dir: "desc" }}
								limit={20}
							/>
						)
					}
				</QueryView>
			</Card>
		</div>
	);
}

interface CostsView {
	summary: CostSummaryView;
	/** Chart color of each individually plotted model; the rest share "Other" gray. */
	swatches: Map<string, string>;
	buckets: number[];
	dailyTotals: number[];
	unpricedPerDay: number[];
	modelSeries: ChartSeries[];
	componentSeries: ChartSeries[];
	maxModelCost: number;
}

function buildCostsView(data: CostDashboardStats, range: TimeRange, t: TranslationFn): CostsView {
	const points = data.costSeries;
	const summary = buildCostSummary(points);
	const colors = buildModelColorLookup(
		summary.models.map(m => ({ model: m.model, provider: m.provider, totalRequests: m.requests })),
	);
	const byKey = new Map(summary.models.map(m => [m.key, m]));
	const buckets = bucketAxis(
		range,
		points.map(p => p.timestamp),
		DAY_MS,
	);
	// Zero slots become gaps so the tooltip lists only what was spent that day.
	const modelSeries = pivotSeries(points, {
		buckets,
		key: p => modelKey(p.model, p.provider),
		label: key => byKey.get(key)?.model ?? key,
		value: p => p.cost,
		limit: MODEL_LIMIT,
		colors,
	}).map(s => ({ ...s, values: s.values.map(v => v || null) }));
	// Colors follow request rank (shared with the Models page); the top models by
	// cost can include ranks that wrap onto the same hue, so recolor repeats.
	const used = new Set<string>();
	for (const s of modelSeries) {
		if (s.key === "__other__") continue;
		if (used.has(s.color)) s.color = SERIES_COLORS.find(c => !used.has(c)) ?? s.color;
		used.add(s.color);
	}
	return {
		summary,
		swatches: new Map(modelSeries.filter(s => s.key !== "__other__").map(s => [s.key, s.color])),
		buckets,
		dailyTotals: densify(points, buckets, p => p.cost),
		unpricedPerDay: densify(points, buckets, p => p.unpricedRequests),
		modelSeries,
		componentSeries: components(t).map(c => ({
			key: c.key,
			label: c.label,
			color: c.color,
			values: densify(points, buckets, p => p[c.key]).map(v => v || null),
		})),
		maxModelCost: summary.models[0]?.cost ?? 0,
	};
}

function CostStats({ view, stale, locale }: { view: CostsView; stale: boolean; locale: Locale }) {
	const { t } = useTranslation();
	const { summary } = view;
	const pricedRequests = summary.requests - summary.unpricedRequests;
	const top = summary.topModel;
	return (
		<div data-stale={stale}>
			<StatGrid min={180}>
				<Stat
					label={t("costs.apiEquivalent")}
					title={t("common.costTooltip")}
					value={formatEstimatedCost(summary.totalCost, summary.unpricedRequests)}
					hint={t("common.countRequests", { count: formatInteger(summary.requests) })}
					spark={view.dailyTotals}
					sparkColor="var(--chart-secondary)"
				/>
				<Stat
					label={t("costs.avgPerDay")}
					title={t("costs.title.avgPerDay")}
					value={formatEstimatedCost(summary.avgDailyCost, summary.unpricedRequests)}
					hint={t("costs.hint.activeDays", { count: formatInteger(summary.activeDays) })}
				/>
				<Stat
					label={t("costs.topModel")}
					title={top ? `${top.model} (${top.provider})` : undefined}
					value={top ? top.model : "–"}
					hint={
						top
							? t("costs.hint.ofEstimate", {
									cost: formatCost(top.cost, undefined, locale),
									share: formatPercent(top.share),
								})
							: t("costs.nothingPriced")
					}
				/>
				<Stat
					label={t("costs.perPricedRequest")}
					title={t("costs.title.perPricedRequest")}
					value={pricedRequests > 0 ? formatUnitCost(summary.totalCost / pricedRequests, locale) : "–"}
					hint={t("costs.hint.priced", { count: formatInteger(pricedRequests) })}
				/>
				<Stat
					label={t("costs.unpricedRequests")}
					title={t("costs.title.unpricedRequests")}
					value={formatInteger(summary.unpricedRequests)}
					hint={summary.unpricedRequests > 0 ? t("costs.hint.excluded") : t("costs.hint.allPriced")}
				/>
			</StatGrid>
		</div>
	);
}

function ComponentBreakdown({ summary, locale }: { summary: CostSummaryView; locale: Locale }) {
	const { t } = useTranslation();
	const list = components(t);
	return (
		<div className="stack" style={{ gap: 14 }}>
			<ShareBar
				height={10}
				segments={list.map(c => ({ key: c.key, label: c.label, value: summary[c.key], color: c.color }))}
			/>
			<div className="costs-components">
				{list.map(c => (
					<div key={c.key} className="costs-component-row">
						<span className="row">
							<Swatch color={c.color} />
							{c.label}
						</span>
						<span className="num">{formatCost(summary[c.key], undefined, locale)}</span>
						<span className="num dim costs-component-share">
							{summary.totalCost > 0 ? formatPercent(summary[c.key] / summary.totalCost) : "–"}
						</span>
					</div>
				))}
				<div className="costs-component-row costs-component-total">
					<span>{t("costs.total")}</span>
					<span className="num">{formatEstimatedCost(summary.totalCost, summary.unpricedRequests)}</span>
					<span className="costs-component-share" />
				</div>
			</div>
			{summary.unpricedRequests > 0 && (
				<p className="micro dim">{t("costs.unpricedNote", { count: formatInteger(summary.unpricedRequests) })}</p>
			)}
		</div>
	);
}

function buildCostColumns(view: CostsView, t: TranslationFn, locale: Locale): Column<CostModelRow>[] {
	const list = components(t);
	const componentColumns: Column<CostModelRow>[] = list.map(c => ({
		key: c.key,
		header: c.label,
		align: "right",
		sort: row => row[c.key],
		render: row => <span className="num">{formatCost(row[c.key], undefined, locale)}</span>,
	}));
	return [
		{
			key: "model",
			header: t("common.model"),
			sort: row => row.model,
			render: row => (
				<LabelCell
					lead={<Swatch color={view.swatches.get(row.key) ?? OTHER_COLOR} />}
					primary={<span className="mono">{row.model}</span>}
					secondary={row.provider}
				/>
			),
		},
		{
			key: "requests",
			header: t("common.requests"),
			align: "right",
			sort: row => row.requests,
			render: row => <span className="num">{formatInteger(row.requests)}</span>,
		},
		{
			key: "cost",
			header: t("costs.estimate"),
			title: t("costs.apiEquivalent"),
			align: "right",
			sort: row => row.cost,
			render: row => (
				<MeterCell
					value={row.cost}
					max={view.maxModelCost}
					display={formatEstimatedCost(row.cost, row.unpricedRequests)}
					color={view.swatches.get(row.key) ?? OTHER_COLOR}
				/>
			),
		},
		{
			key: "share",
			header: t("providers.columns.share"),
			align: "right",
			sort: row => row.share,
			render: row => <span className="num muted">{row.cost > 0 ? formatPercent(row.share) : "–"}</span>,
		},
		{
			key: "split",
			header: t("costs.split"),
			title: t("costs.splitTooltip"),
			width: 150,
			render: row =>
				row.cost > 0 ? (
					<ShareBar
						segments={list.map(c => ({ key: c.key, label: c.label, value: row[c.key], color: c.color }))}
					/>
				) : (
					<span className="dim">–</span>
				),
		},
		...componentColumns,
		{
			key: "perRequest",
			header: t("costs.perRequest"),
			title: t("costs.title.perRequest"),
			align: "right",
			sort: row => (row.requests > row.unpricedRequests ? row.cost / (row.requests - row.unpricedRequests) : -1),
			render: row => (
				<span className="num">
					{row.requests > row.unpricedRequests
						? formatUnitCost(row.cost / (row.requests - row.unpricedRequests), locale)
						: "–"}
				</span>
			),
		},
		{
			key: "unpriced",
			header: t("costs.unpriced"),
			title: t("costs.title.unpriced"),
			align: "right",
			sort: row => row.unpricedRequests,
			render: row =>
				row.unpricedRequests > 0 ? (
					<span className="num tone-warn">{formatInteger(row.unpricedRequests)}</span>
				) : (
					<span className="num dim">–</span>
				),
		},
	];
}

/** Per-request cost; amounts below the 4-digit precision read as a bound instead of "$0.0000". */
function formatUnitCost(value: number, locale: Locale): string {
	return value > 0 && value < 0.0001 ? "<$0.0001" : formatCost(value, undefined, locale);
}

function sum(values: readonly (number | null)[]): number {
	let total = 0;
	for (const v of values) total += v ?? 0;
	return total;
}
