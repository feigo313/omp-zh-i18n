import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { getToolDashboardStats } from "../api";
import { CHART_THEMES, MODEL_COLORS } from "../components/chart-shared";
import { formatRangeTick, rangeMeta } from "../components/range-meta";
import { formatCompact, formatCost, formatInteger, formatPercent, formatRelativeTime } from "../data/formatters";
import { useResource } from "../data/useResource";
import { buildToolRows, type ToolRowView } from "../data/view-models";
import { useTranslation } from "../i18n";
import type { TimeRange, ToolModelStats, ToolTimeSeriesPoint, ToolUsageStats } from "../types";
import { AsyncBoundary, DataTable, Panel, StatusPill } from "../ui";
import { useSystemTheme } from "../useSystemTheme";

export interface ToolsRouteProps {
	active: boolean;
	range: TimeRange;
	refreshTrigger: number;
}

export function ToolsRoute({ active, range, refreshTrigger }: ToolsRouteProps) {
	const { t } = useTranslation();
	const {
		data: stats,
		error,
		loading,
	} = useResource(["tools", range, refreshTrigger], signal => getToolDashboardStats(range, signal), {
		pollMs: 30000,
		enabled: active,
	});

	return (
		<div className="stats-route-container space-y-6">
			<AsyncBoundary loading={loading} error={error} data={stats} emptyText={t("tools.emptyText")}>
				{stats && (
					<>
						<ToolsSummaryPanel byTool={stats.byTool} />
						<ToolCallsChart series={stats.series} timeRange={range} />
						<ToolsTable byTool={stats.byTool} />
						<ToolModelPanel byToolModel={stats.byToolModel} />
					</>
				)}
			</AsyncBoundary>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Summary metrics
// ---------------------------------------------------------------------------

function ToolsSummaryPanel({ byTool }: { byTool: ToolUsageStats[] }) {
	const { t, locale } = useTranslation();
	const totals = useMemo(() => {
		let calls = 0;
		let errors = 0;
		let tokens = 0;
		let output = 0;
		let cost = 0;
		let resultChars = 0;
		let argsChars = 0;
		for (const item of byTool) {
			calls += item.calls;
			errors += item.errors;
			tokens += item.totalTokensShare;
			output += item.outputTokensShare;
			cost += item.costShare;
			resultChars += item.resultChars;
			argsChars += item.argsChars;
		}
		return { calls, errors, tokens, output, cost, resultChars, argsChars, tools: byTool.length };
	}, [byTool]);

	return (
		<Panel title={t("tools.title")} subtitle={t("tools.subtitle")}>
			<div className="stats-metric-cluster">
				<div className="stats-metric-primary-grid">
					<div className="stats-metric-card primary">
						<div className="stats-metric-label">{t("tools.metric.toolCalls")}</div>
						<div className="stats-metric-value">{formatInteger(totals.calls)}</div>
					</div>
					<div className="stats-metric-card primary">
						<div className="stats-metric-label">{t("tools.metric.toolsUsed")}</div>
						<div className="stats-metric-value">{formatInteger(totals.tools)}</div>
					</div>
					<div className="stats-metric-card primary">
						<div className="stats-metric-label">{t("tools.metric.errorRate")}</div>
						<div className="stats-metric-value">
							{formatPercent(totals.calls > 0 ? totals.errors / totals.calls : 0)}
						</div>
					</div>
					<div className="stats-metric-card primary">
						<div className="stats-metric-label">{t("tools.metric.attributedCost")}</div>
						<div className="stats-metric-value">{formatCost(totals.cost, undefined, locale)}</div>
					</div>
				</div>

				<div className="stats-metric-secondary-grid">
					<div className="stats-metric-card secondary">
						<div className="stats-metric-label">{t("tools.metric.attributedTokens")}</div>
						<div className="stats-metric-value">{formatCompact(Math.round(totals.tokens), locale)}</div>
					</div>
					<div className="stats-metric-card secondary">
						<div className="stats-metric-label">{t("tools.metric.attributedOutput")}</div>
						<div className="stats-metric-value">{formatCompact(Math.round(totals.output), locale)}</div>
					</div>
					<div className="stats-metric-card secondary">
						<div className="stats-metric-label">{t("tools.metric.resultText")}</div>
						<div className="stats-metric-value">
							{formatCompact(totals.resultChars, locale)} {t("tools.metric.charsSuffix")}
						</div>
					</div>
					<div className="stats-metric-card secondary">
						<div className="stats-metric-label">{t("tools.metric.callArguments")}</div>
						<div className="stats-metric-value">
							{formatCompact(totals.argsChars, locale)} {t("tools.metric.charsSuffix")}
						</div>
					</div>
				</div>
			</div>
		</Panel>
	);
}

// ---------------------------------------------------------------------------
// Calls over time (stacked by top tools)
// ---------------------------------------------------------------------------

const TOP_TOOLS = 6;

function buildToolCallSeries(
	points: ToolTimeSeriesPoint[],
	t: (key: string) => string,
): {
	buckets: number[];
	tools: string[];
	data: Map<number, Record<string, number>>;
} {
	const totals = new Map<string, number>();
	for (const p of points) totals.set(p.tool, (totals.get(p.tool) ?? 0) + p.calls);
	const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
	const top = ranked.slice(0, TOP_TOOLS).map(([tool]) => tool);
	const topSet = new Set(top);
	const hasOther = ranked.length > top.length;
	const tools = hasOther ? [...top, t("tools.chart.other")] : top;

	const buckets = [...new Set(points.map(p => p.timestamp))].sort((a, b) => a - b);
	const data = new Map<number, Record<string, number>>();
	for (const bucket of buckets) data.set(bucket, {});
	for (const p of points) {
		const label = topSet.has(p.tool) ? p.tool : t("tools.chart.other");
		const row = data.get(p.timestamp);
		if (row) row[label] = (row[label] ?? 0) + p.calls;
	}
	return { buckets, tools, data };
}

function ToolCallsChart({ series, timeRange }: { series: ToolTimeSeriesPoint[]; timeRange: TimeRange }) {
	const { t } = useTranslation();
	const theme = useSystemTheme();
	const chartTheme = CHART_THEMES[theme];
	const meta = rangeMeta(timeRange, t);

	const chartSeries = useMemo(() => buildToolCallSeries(series, t), [series, t]);

	const data = useMemo(
		() => ({
			labels: chartSeries.buckets.map(ts => formatRangeTick(ts, timeRange)),
			datasets: chartSeries.tools.map((tool, index) => ({
				label: tool,
				data: chartSeries.buckets.map(bucket => chartSeries.data.get(bucket)?.[tool] ?? 0),
				borderColor: MODEL_COLORS[index % MODEL_COLORS.length],
				backgroundColor: `${MODEL_COLORS[index % MODEL_COLORS.length]}30`,
				fill: true,
				tension: 0.4,
				pointRadius: 0,
				pointHoverRadius: 4,
				borderWidth: 2,
			})),
		}),
		[chartSeries, timeRange],
	);

	const options = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: "index" as const, intersect: false },
			plugins: {
				legend: {
					position: "top" as const,
					align: "start" as const,
					labels: {
						color: chartTheme.legendLabel,
						usePointStyle: true,
						padding: 16,
						font: { size: 12 },
						boxWidth: 8,
					},
				},
				tooltip: {
					backgroundColor: chartTheme.tooltipBackground,
					titleColor: chartTheme.tooltipTitle,
					bodyColor: chartTheme.tooltipBody,
					borderColor: chartTheme.tooltipBorder,
					borderWidth: 1,
					padding: 12,
					cornerRadius: 8,
					callbacks: {
						label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) =>
							`${context.dataset.label ?? ""}: ${formatInteger(context.parsed.y ?? 0)} ${t("tools.chart.tooltipCallsSuffix")}`,
					},
				},
			},
			scales: {
				x: {
					stacked: true,
					grid: { color: chartTheme.grid, drawBorder: false },
					ticks: { color: chartTheme.tick, font: { size: 11 } },
				},
				y: {
					stacked: true,
					grid: { color: chartTheme.grid, drawBorder: false },
					ticks: { color: chartTheme.tick, font: { size: 11 }, precision: 0 },
					min: 0,
				},
			},
		}),
		[chartTheme],
	);

	return (
		<Panel title={t("tools.chart.title")} subtitle={t("tools.chart.subtitle", { window: meta.windowLabel })}>
			<div className="h-[280px]">
				{chartSeries.buckets.length === 0 ? (
					<div className="h-full flex items-center justify-center text-stats-muted text-sm">
						{t("tools.chart.noData")}
					</div>
				) : (
					<Line data={data} options={options} />
				)}
			</div>
		</Panel>
	);
}

// ---------------------------------------------------------------------------
// Per-tool table
// ---------------------------------------------------------------------------

function errorPillVariant(errorRate: number): "danger" | "warning" | "success" {
	return errorRate > 0.1 ? "danger" : errorRate > 0 ? "warning" : "success";
}

function ToolsTable({ byTool }: { byTool: ToolUsageStats[] }) {
	const { t, locale } = useTranslation();
	const rows = useMemo(() => buildToolRows(byTool), [byTool]);

	const columns = useMemo(
		() => [
			{
				key: "tool",
				header: t("tools.table.column.tool"),
				render: (item: ToolRowView) => (
					<div className="stats-font-medium stats-text-primary font-mono truncate max-w-[280px]" title={item.tool}>
						{item.tool}
					</div>
				),
			},
			{
				key: "calls",
				header: t("tools.table.column.calls"),
				numeric: true,
				render: (item: ToolRowView) => (
					<div className="stats-text-right">
						<div className="font-mono">{formatInteger(item.calls)}</div>
						<div className="stats-progress-bar-track mt-1 ml-auto w-24 h-1">
							<div
								className="stats-progress-bar-fill"
								data-variant="link"
								style={{ width: `${item.callsPercentage}%` }}
							/>
						</div>
					</div>
				),
			},
			{
				key: "errorRate",
				header: t("tools.table.column.errorRate"),
				numeric: true,
				render: (item: ToolRowView) => (
					<StatusPill variant={errorPillVariant(item.errorRate)}>{formatPercent(item.errorRate)}</StatusPill>
				),
			},
			{
				key: "tokens",
				header: t("tools.table.column.attrTokens"),
				numeric: true,
				render: (item: ToolRowView) => (
					<span className="font-mono" title={t("tools.table.tooltip.attrTokens")}>
						{formatCompact(Math.round(item.totalTokensShare), locale)}
					</span>
				),
			},
			{
				key: "cost",
				header: t("tools.table.column.attrCost"),
				numeric: true,
				render: (item: ToolRowView) => (
					<span className="font-mono">{formatCost(item.costShare, undefined, locale)}</span>
				),
			},
			{
				key: "resultChars",
				header: t("tools.table.column.resultText"),
				numeric: true,
				render: (item: ToolRowView) => (
					<span className="font-mono" title={t("tools.table.tooltip.resultText")}>
						{formatCompact(item.resultChars, locale)}
					</span>
				),
			},
			{
				key: "lastUsed",
				header: t("tools.table.column.lastUsed"),
				numeric: true,
				render: (item: ToolRowView) => (
					<span className="stats-text-secondary">{formatRelativeTime(item.lastUsed)}</span>
				),
			},
		],
		[],
	);

	const renderMobileCard = (item: ToolRowView) => (
		<div className="stats-mobile-card">
			<div className="stats-mobile-card-header mb-2">
				<div className="stats-font-semibold stats-text-primary font-mono">{item.tool}</div>
				<StatusPill variant={errorPillVariant(item.errorRate)}>
					{formatPercent(item.errorRate)} {t("tools.mobile.errSuffix")}
				</StatusPill>
			</div>
			<div className="stats-mobile-card-grid">
				<div>
					<div className="stats-mobile-card-label">{t("tools.table.column.calls")}</div>
					<div className="stats-mobile-card-value font-mono">{formatInteger(item.calls)}</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("tools.table.column.attrTokens")}</div>
					<div className="stats-mobile-card-value font-mono">
						{formatCompact(Math.round(item.totalTokensShare), locale)}
					</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("tools.table.column.attrCost")}</div>
					<div className="stats-mobile-card-value font-mono">{formatCost(item.costShare, undefined, locale)}</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("tools.table.column.resultText")}</div>
					<div className="stats-mobile-card-value font-mono">{formatCompact(item.resultChars, locale)}</div>
				</div>
			</div>
		</div>
	);

	return (
		<Panel title={t("tools.table.byToolTitle")} subtitle={t("tools.table.byToolSubtitle")}>
			<DataTable
				columns={columns}
				data={rows}
				keyExtractor={item => item.tool}
				renderMobileCard={renderMobileCard}
				emptyText={t("tools.emptyText")}
			/>
		</Panel>
	);
}

// ---------------------------------------------------------------------------
// Per-(tool, model) breakdown
// ---------------------------------------------------------------------------

function ToolModelPanel({ byToolModel }: { byToolModel: ToolModelStats[] }) {
	const { t, locale } = useTranslation();
	const [tool, setTool] = useState<string | null>(null);

	const tools = useMemo(() => [...new Set(byToolModel.map(row => row.tool))].sort(), [byToolModel]);

	const rows = useMemo(() => {
		const filtered = tool ? byToolModel.filter(row => row.tool === tool) : byToolModel;
		return filtered.map(row => ({
			...row,
			errorRate: row.calls > 0 ? row.errors / row.calls : 0,
		}));
	}, [byToolModel, tool]);

	const columns = useMemo(
		() => [
			{
				key: "tool",
				header: t("tools.table.column.tool"),
				render: (item: ToolModelStats & { errorRate: number }) => (
					<span className="stats-font-medium stats-text-primary font-mono">{item.tool}</span>
				),
			},
			{
				key: "model",
				header: t("common.model"),
				render: (item: ToolModelStats & { errorRate: number }) => (
					<div>
						<div className="stats-text-primary">{item.model || t("tools.model.unknown")}</div>
						<div className="stats-text-secondary text-xs">{item.provider}</div>
					</div>
				),
			},
			{
				key: "calls",
				header: t("tools.table.column.calls"),
				numeric: true,
				render: (item: ToolModelStats & { errorRate: number }) => (
					<span className="font-mono">{formatInteger(item.calls)}</span>
				),
			},
			{
				key: "errorRate",
				header: t("tools.table.column.errorRate"),
				numeric: true,
				render: (item: ToolModelStats & { errorRate: number }) => (
					<StatusPill variant={errorPillVariant(item.errorRate)}>{formatPercent(item.errorRate)}</StatusPill>
				),
			},
			{
				key: "tokens",
				header: t("tools.table.column.attrTokens"),
				numeric: true,
				render: (item: ToolModelStats & { errorRate: number }) => (
					<span className="font-mono">{formatCompact(Math.round(item.totalTokensShare), locale)}</span>
				),
			},
			{
				key: "cost",
				header: t("tools.table.column.attrCost"),
				numeric: true,
				render: (item: ToolModelStats & { errorRate: number }) => (
					<span className="font-mono">{formatCost(item.costShare, undefined, locale)}</span>
				),
			},
		],
		[],
	);

	return (
		<Panel title={t("tools.model.title")} subtitle={t("tools.model.subtitle")}>
			<div className="mb-4" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
				<span className="stats-text-secondary" style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
					{t("tools.model.filterLabel")}
				</span>
				<select
					className="stats-select"
					value={tool ?? ""}
					onChange={e => setTool(e.target.value || null)}
					style={{ maxWidth: "320px", flex: 1 }}
				>
					<option value="">{t("tools.model.filterAll")}</option>
					{tools.map(name => (
						<option key={name} value={name}>
							{name}
						</option>
					))}
				</select>
			</div>
			<DataTable
				columns={columns}
				data={rows}
				keyExtractor={item => `${item.tool}::${item.model}::${item.provider}`}
				emptyText={t("tools.emptyText")}
			/>
		</Panel>
	);
}
