import { useMemo, useState } from "react";
import { getModelList, getRecentErrors } from "../api";
import { formatCost, formatInteger, formatRelativeTime } from "../data/formatters";
import { useResource } from "../data/useResource";
import { useTranslation } from "../i18n";
import type { MessageStats, TimeRange } from "../types";
import { AsyncBoundary, DataTable, ModelFilter, Pagination, Panel, StatusPill } from "../ui";

const PAGE_SIZE = 50;

export interface ErrorsRouteProps {
	active: boolean;
	range: TimeRange;
	refreshTrigger: number;
	onRequestClick: (id: number) => void;
}

export function ErrorsRoute({ active, range, refreshTrigger, onRequestClick }: ErrorsRouteProps) {
	const { t, locale } = useTranslation();
	const [page, setPage] = useState(1);
	const [modelFilter, setModelFilter] = useState<string | null>(null);

	const offset = (page - 1) * PAGE_SIZE;

	const { data: models } = useResource(["models-list"], signal => getModelList(signal), {
		enabled: active,
	});

	const {
		data: result,
		error,
		loading,
	} = useResource(
		["recent-errors-dense", refreshTrigger, page, modelFilter, range],
		signal => getRecentErrors(range, PAGE_SIZE, offset, modelFilter ?? undefined, signal),
		{
			pollMs: 30000,
			enabled: active,
		},
	);

	const recentErrors = result?.items ?? null;
	const total = result?.total ?? 0;

	const handleModelChange = (model: string | null) => {
		setModelFilter(model);
		setPage(1);
	};

	const columns = useMemo(
		() => [
			{
				key: "model",
				header: t("errors.column.model"),
				render: (item: MessageStats) => (
					<div>
						<div className="stats-font-medium stats-text-primary">{item.model}</div>
						<div className="stats-text-xs stats-text-muted">{item.provider}</div>
					</div>
				),
			},
			{
				key: "timestamp",
				header: t("errors.column.time"),
				render: (item: MessageStats) => formatRelativeTime(item.timestamp, locale),
			},
			{
				key: "errorMessage",
				header: t("errors.column.errorMessage"),
				render: (item: MessageStats) => (
					<div
						className="stats-text-xs stats-text-danger stats-truncate stats-max-w-md stats-font-mono"
						title={item.errorMessage || ""}
					>
						{item.errorMessage || t("errors.unknownError")}
					</div>
				),
			},
			{
				key: "tokens",
				header: t("errors.column.tokens"),
				numeric: true,
				render: (item: MessageStats) => formatInteger(item.usage.totalTokens),
			},
			{
				key: "cost",
				header: t("errors.column.cost"),
				numeric: true,
				render: (item: MessageStats) => formatCost(item.usage.cost.total, 4, locale),
			},
		],
		[t, locale],
	);

	const renderMobileCard = (item: MessageStats, onClick?: () => void) => (
		<div className="stats-mobile-card stats-border-danger" onClick={onClick}>
			<div className="stats-mobile-card-header">
				<div>
					<div className="stats-font-semibold stats-text-primary">{item.model}</div>
					<div className="stats-text-xs stats-text-muted">{item.provider}</div>
				</div>
				<StatusPill variant="danger">{t("errors.status.failed")}</StatusPill>
			</div>
			<div className="stats-mobile-card-grid">
				<div>
					<div className="stats-mobile-card-label">{t("errors.column.time")}</div>
					<div className="stats-mobile-card-value">{formatRelativeTime(item.timestamp, locale)}</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("errors.column.cost")}</div>
					<div className="stats-mobile-card-value">{formatCost(item.usage.cost.total, 4, locale)}</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("errors.column.tokens")}</div>
					<div className="stats-mobile-card-value">{formatInteger(item.usage.totalTokens)}</div>
				</div>
			</div>
			{item.errorMessage && <div className="stats-mobile-card-error mt-2 stats-font-mono">{item.errorMessage}</div>}
		</div>
	);

	return (
		<div className="stats-route-container">
			<Panel
				title={t("errors.title")}
				subtitle={t("errors.subtitle")}
				actions={<ModelFilter models={models ?? []} value={modelFilter} onChange={handleModelChange} />}
			>
				<AsyncBoundary loading={loading} error={error} data={recentErrors} emptyText={t("errors.noFailures")}>
					<DataTable
						columns={columns}
						data={recentErrors || []}
						keyExtractor={item => item.id || `${item.sessionFile}-${item.entryId}`}
						onRowClick={item => item.id && onRequestClick(item.id)}
						renderMobileCard={renderMobileCard}
						emptyText={t("errors.noFailures")}
					/>
				</AsyncBoundary>
				<Pagination currentPage={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
			</Panel>
		</div>
	);
}
