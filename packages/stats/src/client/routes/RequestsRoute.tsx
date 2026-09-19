import { useMemo, useState } from "react";
import { getModelList, getRecentRequests } from "../api";
import { formatDurationMs, formatInteger, formatMessageCost, formatRelativeTime } from "../data/formatters";
import { useResource } from "../data/useResource";
import { useTranslation } from "../i18n";
import type { MessageStats, TimeRange } from "../types";
import { AsyncBoundary, DataTable, ModelFilter, Pagination, Panel, StatusPill } from "../ui";

const PAGE_SIZE = 50;

export interface RequestsRouteProps {
	active: boolean;
	range: TimeRange;
	refreshTrigger: number;
	onRequestClick: (id: number) => void;
}

export function RequestsRoute({ active, refreshTrigger, onRequestClick }: RequestsRouteProps) {
	const { t, locale } = useTranslation();
	const [page, setPage] = useState(1);
	const [modelFilter, setModelFilter] = useState<string | null>(null);

	const offset = (page - 1) * PAGE_SIZE;

	// Fetch model list for the filter dropdown
	const { data: models } = useResource(["models-list"], signal => getModelList(signal), {
		enabled: active,
	});

	const {
		data: result,
		error,
		loading,
	} = useResource(
		["recent-requests-dense", refreshTrigger, page, modelFilter],
		signal => getRecentRequests(PAGE_SIZE, offset, modelFilter ?? undefined, signal),
		{
			pollMs: 30000,
			enabled: active,
		},
	);

	const recentRequests = result?.items ?? null;
	const total = result?.total ?? 0;

	const handleModelChange = (model: string | null) => {
		setModelFilter(model);
		setPage(1);
	};

	const columns = useMemo(
		() => [
			{
				key: "model",
				header: t("requests.column.model"),
				render: (item: MessageStats) => (
					<div>
						<div className="stats-font-medium stats-text-primary">{item.model}</div>
						<div className="stats-text-xs stats-text-muted">{item.provider}</div>
					</div>
				),
			},
			{
				key: "timestamp",
				header: t("requests.column.time"),
				render: (item: MessageStats) => formatRelativeTime(item.timestamp, locale),
			},
			{
				key: "tokens",
				header: t("requests.column.tokens"),
				numeric: true,
				render: (item: MessageStats) => formatInteger(item.usage.totalTokens),
			},
			{
				key: "cost",
				header: "API-equivalent estimate",
				numeric: true,
				render: (item: MessageStats) => formatMessageCost(item, 4),
			},
			{
				key: "duration",
				header: t("requests.column.duration"),
				numeric: true,
				render: (item: MessageStats) => formatDurationMs(item.duration),
			},
			{
				key: "status",
				header: t("requests.column.status"),
				className: "stats-text-center",
				render: (item: MessageStats) => (
					<StatusPill variant={item.errorMessage ? "danger" : "success"}>
						{item.errorMessage ? t("requests.status.failed") : t("requests.status.success")}
					</StatusPill>
				),
			},
		],
		[t, locale],
	);

	const renderMobileCard = (item: MessageStats, onClick?: () => void) => (
		<div className="stats-mobile-card" onClick={onClick}>
			<div className="stats-mobile-card-header">
				<div>
					<div className="stats-font-semibold stats-text-primary">{item.model}</div>
					<div className="stats-text-xs stats-text-muted">{item.provider}</div>
				</div>
				<StatusPill variant={item.errorMessage ? "danger" : "success"}>
					{item.errorMessage ? t("requests.status.failed") : t("requests.status.success")}
				</StatusPill>
			</div>
			<div className="stats-mobile-card-grid">
				<div>
					<div className="stats-mobile-card-label">{t("requests.column.time")}</div>
					<div className="stats-mobile-card-value">{formatRelativeTime(item.timestamp, locale)}</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("costs.apiEquivalent")}</div>
					<div className="stats-mobile-card-value">{formatMessageCost(item, 4)}</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("requests.column.tokens")}</div>
					<div className="stats-mobile-card-value">{formatInteger(item.usage.totalTokens)}</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("requests.column.duration")}</div>
					<div className="stats-mobile-card-value">{formatDurationMs(item.duration)}</div>
				</div>
			</div>
			{item.errorMessage && <div className="stats-mobile-card-error truncate mt-2">{item.errorMessage}</div>}
		</div>
	);

	return (
		<div className="stats-route-container">
			<Panel
				title={t("requests.title")}
				subtitle={t("requests.subtitle")}
				actions={<ModelFilter models={models ?? []} value={modelFilter} onChange={handleModelChange} />}
			>
				<AsyncBoundary loading={loading} error={error} data={recentRequests}>
					<DataTable
						columns={columns}
						data={recentRequests || []}
						keyExtractor={item => item.id || `${item.sessionFile}-${item.entryId}`}
						onRowClick={item => item.id && onRequestClick(item.id)}
						renderMobileCard={renderMobileCard}
						emptyText={t("requests.noRequests")}
					/>
				</AsyncBoundary>
				<Pagination currentPage={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
			</Panel>
		</div>
	);
}
