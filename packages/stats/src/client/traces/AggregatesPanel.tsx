/**
 * Per-tool duration aggregates for one trace (sortable; server order is total
 * time descending).
 */

import { formatDurationMs, formatInteger } from "../data/formatters";
import { useTranslation } from "../i18n";
import type { TraceToolStat } from "../types";
import { Badge, Card, type Column, MeterCell, Table } from "../ui";

export interface AggregatesPanelProps {
	toolStats: TraceToolStat[];
	index?: number;
}

export function AggregatesPanel({ toolStats, index }: AggregatesPanelProps) {
	const { t } = useTranslation();
	if (toolStats.length === 0) return null;
	const maxTotal = Math.max(...toolStats.map(stat => stat.totalMs));
	const columns: Column<TraceToolStat>[] = [
		{
			key: "tool",
			header: t("tools.table.column.tool"),
			render: row => <span className="mono">{row.tool}</span>,
			sort: row => row.tool,
		},
		{
			key: "calls",
			header: t("tools.table.column.calls"),
			align: "right",
			render: row => <span className="num">{formatInteger(row.calls)}</span>,
			sort: row => row.calls,
		},
		{
			key: "errors",
			header: t("common.errors"),
			align: "right",
			render: row =>
				row.errors > 0 ? (
					<Badge tone="bad">{t("traces.aggregates.failed", { count: formatInteger(row.errors) })}</Badge>
				) : (
					<span className="num dim">0</span>
				),
			sort: row => row.errors,
		},
		{
			key: "total",
			header: t("costs.total"),
			align: "right",
			width: 200,
			render: row => (
				<MeterCell value={row.totalMs} max={maxTotal} display={formatDurationMs(row.totalMs)} color="var(--warn)" />
			),
			sort: row => row.totalMs,
		},
		{
			key: "avg",
			header: t("traces.aggregates.column.avg"),
			align: "right",
			render: row => <span className="num">{formatDurationMs(row.calls > 0 ? row.totalMs / row.calls : 0)}</span>,
			sort: row => (row.calls > 0 ? row.totalMs / row.calls : 0),
		},
		{
			key: "max",
			header: t("traces.aggregates.column.max"),
			align: "right",
			render: row => <span className="num">{formatDurationMs(row.maxMs)}</span>,
			sort: row => row.maxMs,
		},
	];
	return (
		<Card
			title={t("traces.aggregates.title")}
			description={t("traces.aggregates.description", { count: toolStats.length })}
			flush
			index={index}
		>
			<Table columns={columns} rows={toolStats} rowKey={row => row.tool} dense limit={12} />
		</Card>
	);
}
