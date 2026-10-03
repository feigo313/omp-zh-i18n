import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { getToolDashboardStats } from "../api";
import { Legend, Sparkline, TimeChart, useHiddenSeries } from "../charts";
import { buildColorLookup, OTHER_COLOR } from "../data/colors";
import {
	formatCompact,
	formatEstimatedCost,
	formatInteger,
	formatPercent,
	formatRelativeTime,
} from "../data/formatters";
import { useQuery } from "../data/query";
import { bucketAxis, rangeMeta } from "../data/range";
import { densify, pivotSeries } from "../data/series";
import { buildToolRows, type ToolRowView } from "../data/view-models";
import { type Locale, type TranslationFn, useTranslation } from "../i18n";
import type { TimeRange, ToolDashboardStats, ToolModelStats, ToolTimeSeriesPoint } from "../types";
import {
	Badge,
	Card,
	ChartSkeleton,
	type Column,
	EmptyState,
	errorRateTone,
	LabelCell,
	MeterCell,
	PageHeader,
	QueryView,
	Segmented,
	Stat,
	StatGrid,
	Swatch,
	Table,
	TableSkeleton,
} from "../ui";
import "./tools.css";

export interface ToolsRouteProps {
	active: boolean;
	range: TimeRange;
}

type CallMetric = "calls" | "errors";

/** Tools stacked individually in the calls chart; the rest fold into "Other". */
const TOP_TOOLS = 6;

const ATTRIBUTION_NOTE_KEY =
	"Tokens and API-equivalent cost of each invoking turn, split evenly across that turn's tool calls";

/** Bucket word for chart subtitles ("5 minutes" / "hour" / "day"). */
function bucketWord(bucketMs: number): string {
	if (bucketMs < 3_600_000) return "common.bucket.5minutes";
	if (bucketMs < 86_400_000) return "common.bucket.hour";
	return "common.bucket.day";
}

export function ToolsRoute({ active, range }: ToolsRouteProps) {
	const { t, locale } = useTranslation();
	const tools = useQuery(["tools", range], () => getToolDashboardStats(range), { enabled: active });
	const [metric, setMetric] = useState<CallMetric>("calls");
	const [hidden, toggleHidden] = useHiddenSeries();
	const [pickedTool, setToolFilter] = useState<string | null>(null);
	const meta = rangeMeta(range);

	const view = useMemo(() => buildToolsView(tools.data, range, t, locale), [tools.data, range, t, locale]);
	const metricOptions = useMemo(
		() => [
			{ value: "calls" as const, label: t("tools.table.column.calls") },
			{ value: "errors" as const, label: t("common.failed") },
		],
		[t],
	);
	const noCalls = <EmptyState title={t("tools.emptyText")} />;
	// A pick from another range only applies while that tool still has calls.
	const toolFilter = pickedTool !== null && view.toolNames.includes(pickedTool) ? pickedTool : null;

	const chartSeries = metric === "calls" ? view.callSeries : view.errorSeries;
	const isEmpty = (data: ToolDashboardStats) => data.byTool.length === 0;

	return (
		<div className="page">
			<PageHeader
				title={t("nav.section.tools")}
				description={t("tools.pageDescription", { window: meta.windowLabel })}
			/>

			<QueryView query={tools} skeleton={<ChartSkeleton height={112} />}>
				{() => {
					const totals = view.totals;
					const attributionNote = t(ATTRIBUTION_NOTE_KEY);
					return (
						<div data-stale={tools.stale} className="stack" style={{ gap: 16 }}>
							<StatGrid min={190}>
								<Stat
									label={t("tools.metric.toolCalls")}
									value={formatInteger(totals.calls)}
									hint={t("common.failedCount", { count: formatInteger(totals.errors) })}
									spark={view.totalCalls}
								/>
								<Stat
									label={t("tools.stat.distinctTools")}
									value={formatInteger(totals.tools)}
									hint={view.rows[0] ? t("tools.hint.mostUsed", { tool: view.rows[0].tool }) : undefined}
								/>
								<Stat
									label={t("tools.metric.errorRate")}
									title={t("tools.tooltip.errors")}
									value={formatPercent(totals.calls > 0 ? totals.errors / totals.calls : 0)}
									hint={t("common.succeededCount", {
										count: formatInteger(totals.calls - totals.errors),
									})}
									spark={view.totalErrors}
									sparkColor="var(--bad)"
								/>
								<Stat
									label={t("tools.metric.attributedTokens")}
									title={attributionNote}
									value={formatCompact(Math.round(totals.tokens), locale)}
									hint={t("common.hint.output", {
										count: formatCompact(Math.round(totals.output), locale),
									})}
								/>
								<Stat
									label={t("tools.metric.attributedCost")}
									title={`${attributionNote}; ${t("costs.apiEquivalent")}`}
									value={formatEstimatedCost(totals.cost, totals.unpriced)}
									hint={
										totals.unpriced > 0
											? t("tools.hint.unpricedRequests", {
													count: formatInteger(Math.round(totals.unpriced)),
												})
											: t("costs.apiEquivalent")
									}
								/>
							</StatGrid>
							<StatGrid min={150}>
								<Stat
									size="sm"
									label={t("tools.metric.resultText")}
									title={t("tools.table.tooltip.resultText")}
									value={`${formatCompact(totals.resultChars, locale)} ${t("tools.metric.charsSuffix")}`}
								/>
								<Stat
									size="sm"
									label={t("tools.metric.callArguments")}
									title={t("tools.tooltip.args")}
									value={`${formatCompact(totals.argsChars, locale)} ${t("tools.metric.charsSuffix")}`}
								/>
								<Stat
									size="sm"
									label={t("tools.stat.avgResult")}
									value={`${formatCompact(totals.calls > 0 ? Math.round(totals.resultChars / totals.calls) : 0, locale)} ${t("tools.metric.charsSuffix")}`}
								/>
								<Stat
									size="sm"
									label={t("tools.stat.avgArgs")}
									value={`${formatCompact(totals.calls > 0 ? Math.round(totals.argsChars / totals.calls) : 0, locale)} ${t("tools.metric.charsSuffix")}`}
								/>
							</StatGrid>
						</div>
					);
				}}
			</QueryView>

			<Card
				index={1}
				title={metric === "calls" ? t("tools.chart.title") : t("tools.chart.errorsOverTime")}
				description={t("tools.chart.stackedDescription", {
					bucket: t(bucketWord(meta.bucketMs)),
					top: TOP_TOOLS,
				})}
				actions={<Segmented size="sm" options={metricOptions} value={metric} onChange={setMetric} />}
				stale={tools.stale}
			>
				<QueryView query={tools} skeleton={<ChartSkeleton height={260} />} isEmpty={isEmpty} empty={noCalls}>
					{() => (
						<div className="stack" style={{ gap: 12 }}>
							<TimeChart
								buckets={view.buckets}
								bucketMs={meta.bucketMs}
								series={chartSeries}
								hidden={hidden}
								height={260}
								formatTooltip={formatInteger}
								emptyLabel={metric === "errors" ? t("tools.emptyErrors") : undefined}
							/>
							<Legend
								items={chartSeries.map(s => ({
									key: s.key,
									label: s.label,
									color: s.color,
									value: formatCompact(
										s.values.reduce<number>((sum, v) => sum + (v ?? 0), 0),
										locale,
									),
								}))}
								hidden={hidden}
								onToggle={toggleHidden}
							/>
						</div>
					)}
				</QueryView>
			</Card>

			<Card
				index={2}
				title={t("tools.table.byToolTitle")}
				description={t("tools.byToolDescription")}
				flush
				stale={tools.stale}
			>
				<QueryView query={tools} skeleton={<TableSkeleton rows={8} />} isEmpty={isEmpty} empty={noCalls}>
					{() => (
						<Table
							rows={view.rows}
							rowKey={row => row.tool}
							columns={view.toolColumns}
							initialSort={{ key: "calls", dir: "desc" }}
							limit={20}
							selectedKey={toolFilter}
							onRowClick={row => setToolFilter(prev => (prev === row.tool ? null : row.tool))}
							dense
						/>
					)}
				</QueryView>
			</Card>

			<Card
				index={3}
				title={t("tools.byToolAndModel.title")}
				description={t("tools.byToolAndModel.description")}
				flush
				stale={tools.stale}
				actions={
					<div className="row" style={{ gap: 6 }}>
						<select
							className="input tools-filter"
							value={toolFilter ?? ""}
							onChange={e => setToolFilter(e.target.value || null)}
							aria-label={t("tools.model.filterLabel")}
						>
							<option value="">{t("tools.model.filterAll")}</option>
							{view.toolNames.map(name => (
								<option key={name} value={name}>
									{name}
								</option>
							))}
						</select>
						{toolFilter !== null && (
							<button
								type="button"
								className="btn"
								data-size="sm"
								data-variant="ghost"
								data-icon="true"
								title={t("tools.clearFilter")}
								aria-label={t("tools.clearFilter")}
								onClick={() => setToolFilter(null)}
							>
								<X size={13} />
							</button>
						)}
					</div>
				}
			>
				<QueryView query={tools} skeleton={<TableSkeleton rows={8} />} isEmpty={isEmpty} empty={noCalls}>
					{data => <ToolModelTable rows={data.byToolModel} tool={toolFilter} colors={view.colors} />}
				</QueryView>
			</Card>
		</div>
	);
}

// ---------------------------------------------------------------------------
// View model
// ---------------------------------------------------------------------------

interface ToolTotals {
	calls: number;
	errors: number;
	tools: number;
	tokens: number;
	output: number;
	cost: number;
	unpriced: number;
	resultChars: number;
	argsChars: number;
}

function buildToolsView(data: ToolDashboardStats | null, range: TimeRange, tr: TranslationFn, locale: Locale) {
	const byTool = data?.byTool ?? [];
	const points = data?.series ?? [];
	const rows = buildToolRows(byTool).sort((a, b) => b.calls - a.calls);
	const colors = buildColorLookup(byTool.map(t => ({ key: t.tool, weight: t.calls })));
	const buckets = bucketAxis(
		range,
		points.map(p => p.timestamp),
	);

	const totals: ToolTotals = {
		calls: 0,
		errors: 0,
		tools: byTool.length,
		tokens: 0,
		output: 0,
		cost: 0,
		unpriced: 0,
		resultChars: 0,
		argsChars: 0,
	};
	for (const t of byTool) {
		totals.calls += t.calls;
		totals.errors += t.errors;
		totals.tokens += t.totalTokensShare;
		totals.output += t.outputTokensShare;
		totals.cost += t.costShare;
		totals.unpriced += t.unpricedRequestsShare;
		totals.resultChars += t.resultChars;
		totals.argsChars += t.argsChars;
	}

	// Every tool keeps its table swatch color in both metrics; zero slots become
	// gaps so the tooltip lists only tools active in that bucket.
	const [callSeries, errorSeries] = [(p: ToolTimeSeriesPoint) => p.calls, (p: ToolTimeSeriesPoint) => p.errors].map(
		value =>
			pivotSeries(points, { buckets, key: p => p.tool, value, limit: TOP_TOOLS, colors }).map(s => ({
				...s,
				values: s.values.map(v => v || null),
			})),
	);
	// Unlimited pivot for the per-row sparklines.
	const trends = new Map(
		pivotSeries(points, { buckets, key: p => p.tool, value: p => p.calls }).map(s => [s.key, s.values as number[]]),
	);

	const maxCalls = rows[0]?.calls ?? 0;
	const toolColumns = buildToolColumns(maxCalls, colors, trends, tr, locale);

	return {
		rows,
		colors,
		buckets,
		totals,
		callSeries,
		errorSeries,
		totalCalls: densify(points, buckets, p => p.calls),
		totalErrors: densify(points, buckets, p => p.errors),
		toolNames: rows.map(r => r.tool).sort((a, b) => a.localeCompare(b)),
		toolColumns,
	};
}

function buildToolColumns(
	maxCalls: number,
	colors: ReadonlyMap<string, string>,
	trends: ReadonlyMap<string, number[]>,
	t: TranslationFn,
	locale: Locale,
): Column<ToolRowView>[] {
	const attributionNote = t(ATTRIBUTION_NOTE_KEY);
	return [
		{
			key: "tool",
			header: t("tools.table.column.tool"),
			sort: row => row.tool,
			render: row => (
				<span className="row" style={{ gap: 8 }}>
					<Swatch color={colors.get(row.tool) ?? OTHER_COLOR} />
					<span className="mono truncate tools-name" title={row.tool}>
						{row.tool}
					</span>
				</span>
			),
		},
		{
			key: "trend",
			header: t("models.trend"),
			title: t("tools.tooltip.trend"),
			render: row => {
				const values = trends.get(row.tool);
				return values && values.length > 1 ? (
					<Sparkline values={values} width={80} height={20} color={colors.get(row.tool) ?? OTHER_COLOR} />
				) : (
					<span className="dim">–</span>
				);
			},
		},
		{
			key: "calls",
			header: t("tools.table.column.calls"),
			align: "right",
			sort: row => row.calls,
			render: row => (
				<MeterCell
					value={row.calls}
					max={maxCalls}
					display={
						<span title={t("common.tooltip.shareOfCalls", { share: formatPercent(row.callFraction) })}>
							{formatInteger(row.calls)}
							<span className="dim tools-share">{formatPercent(row.callFraction, 0)}</span>
						</span>
					}
				/>
			),
		},
		{
			key: "errorRate",
			header: t("common.errors"),
			title: t("tools.tooltip.errorColumn"),
			align: "right",
			sort: row => row.errorRate,
			render: row => (
				<span className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
					<span className="num dim">{formatInteger(row.errors)}</span>
					<Badge tone={row.errors > 0 ? errorRateTone(row.errorRate) : "neutral"} mono>
						{formatPercent(row.errorRate)}
					</Badge>
				</span>
			),
		},
		{
			key: "args",
			header: t("tools.column.args"),
			title: t("tools.tooltip.args"),
			align: "right",
			sort: row => row.argsChars,
			render: row => <span className="num">{formatCompact(row.argsChars, locale)}</span>,
		},
		{
			key: "result",
			header: t("tools.table.column.resultText"),
			title: t("tools.table.tooltip.resultText"),
			align: "right",
			sort: row => row.resultChars,
			render: row => <span className="num">{formatCompact(row.resultChars, locale)}</span>,
		},
		{
			key: "avgResult",
			header: t("tools.column.resultPerCall"),
			title: t("tools.tooltip.avgResult"),
			align: "right",
			sort: row => row.avgResultChars,
			render: row => <span className="num muted">{formatCompact(Math.round(row.avgResultChars), locale)}</span>,
		},
		{
			key: "tokens",
			header: t("tools.table.column.attrTokens"),
			title: attributionNote,
			align: "right",
			sort: row => row.totalTokensShare,
			render: row => (
				<span className="num" title={t("tools.tooltip.tokenShare", { share: formatPercent(row.tokenFraction) })}>
					{formatCompact(Math.round(row.totalTokensShare), locale)}
					<span className="dim tools-share">{formatPercent(row.tokenFraction, 0)}</span>
				</span>
			),
		},
		{
			key: "cost",
			header: t("tools.table.column.attrCost"),
			title: `${attributionNote}; ${t("costs.apiEquivalent")}`,
			align: "right",
			sort: row => row.costShare,
			render: row => (
				<span className="num" title={t("tools.tooltip.costShare", { share: formatPercent(row.costFraction) })}>
					{formatEstimatedCost(row.costShare, row.unpricedRequestsShare)}
					<span className="dim tools-share">{formatPercent(row.costFraction, 0)}</span>
				</span>
			),
		},
		{
			key: "lastUsed",
			header: t("tools.table.column.lastUsed"),
			align: "right",
			sort: row => row.lastUsed,
			render: row => <span className="muted">{formatRelativeTime(row.lastUsed, locale)}</span>,
		},
	];
}

// ---------------------------------------------------------------------------
// Tool × model breakdown
// ---------------------------------------------------------------------------

interface ToolModelRow extends ToolModelStats {
	errorRate: number;
}

function ToolModelTable({
	rows,
	tool,
	colors,
}: {
	rows: ToolModelStats[];
	tool: string | null;
	colors: ReadonlyMap<string, string>;
}) {
	const { t, locale } = useTranslation();
	const filtered = useMemo<ToolModelRow[]>(
		() =>
			(tool === null ? rows : rows.filter(r => r.tool === tool)).map(r => ({
				...r,
				errorRate: r.calls > 0 ? r.errors / r.calls : 0,
			})),
		[rows, tool],
	);
	const columns = useMemo<Column<ToolModelRow>[]>(() => {
		const maxCalls = filtered.reduce((max, r) => Math.max(max, r.calls), 0);
		return [
			{
				key: "tool",
				header: t("tools.table.column.tool"),
				sort: row => row.tool,
				render: row => (
					<span className="row" style={{ gap: 8 }}>
						<Swatch color={colors.get(row.tool) ?? OTHER_COLOR} />
						<span className="mono truncate tools-name" title={row.tool}>
							{row.tool}
						</span>
					</span>
				),
			},
			{
				key: "model",
				header: t("common.model"),
				sort: row => row.model,
				render: row => (
					<LabelCell
						primary={<span className="mono">{row.model || t("tools.model.unknown")}</span>}
						secondary={row.provider}
					/>
				),
			},
			{
				key: "calls",
				header: t("tools.table.column.calls"),
				align: "right",
				sort: row => row.calls,
				render: row => <MeterCell value={row.calls} max={maxCalls} display={formatInteger(row.calls)} />,
			},
			{
				key: "errorRate",
				header: t("common.errors"),
				align: "right",
				sort: row => row.errorRate,
				render: row => (
					<span className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
						<span className="num dim">{formatInteger(row.errors)}</span>
						<Badge tone={row.errors > 0 ? errorRateTone(row.errorRate) : "neutral"} mono>
							{formatPercent(row.errorRate)}
						</Badge>
					</span>
				),
			},
			{
				key: "result",
				header: t("tools.table.column.resultText"),
				title: t("tools.table.tooltip.resultText"),
				align: "right",
				sort: row => row.resultChars,
				render: row => <span className="num">{formatCompact(row.resultChars, locale)}</span>,
			},
			{
				key: "tokens",
				header: t("tools.table.column.attrTokens"),
				title: t(ATTRIBUTION_NOTE_KEY),
				align: "right",
				sort: row => row.totalTokensShare,
				render: row => <span className="num">{formatCompact(Math.round(row.totalTokensShare), locale)}</span>,
			},
			{
				key: "cost",
				header: t("tools.table.column.attrCost"),
				title: `${t(ATTRIBUTION_NOTE_KEY)}; ${t("costs.apiEquivalent")}`,
				align: "right",
				sort: row => row.costShare,
				render: row => <span className="num">{formatEstimatedCost(row.costShare, row.unpricedRequestsShare)}</span>,
			},
			{
				key: "lastUsed",
				header: t("tools.table.column.lastUsed"),
				align: "right",
				sort: row => row.lastUsed,
				render: row => <span className="muted">{formatRelativeTime(row.lastUsed, locale)}</span>,
			},
		];
	}, [filtered, colors]);

	return (
		<Table
			rows={filtered}
			rowKey={row => `${row.tool}::${row.model}::${row.provider}`}
			columns={columns}
			initialSort={{ key: "calls", dir: "desc" }}
			limit={25}
			dense
			empty={<EmptyState title={tool ? t("tools.noCallsTo", { tool }) : t("tools.emptyText")} />}
		/>
	);
}
