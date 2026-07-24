import { useMemo } from "react";
import { getFolderStats } from "../api";
import { formatCost, formatDurationMs, formatInteger, formatPercent } from "../data/formatters";
import { useResource } from "../data/useResource";
import { buildFolderRows, type FolderRowView } from "../data/view-models";
import { useTranslation } from "../i18n";
import type { TimeRange } from "../types";
import { AsyncBoundary, DataTable, Panel, StatusPill } from "../ui";

export interface ProjectsRouteProps {
	active: boolean;
	range: TimeRange;
	refreshTrigger: number;
}

export function ProjectsRoute({ active, range, refreshTrigger }: ProjectsRouteProps) {
	const { t, locale } = useTranslation();

	const {
		data: foldersData,
		error,
		loading,
	} = useResource(["projects", range, refreshTrigger], signal => getFolderStats(range, signal), {
		pollMs: 30000,
		enabled: active,
	});

	const folderRows = useMemo(() => {
		if (!foldersData) return [];
		return buildFolderRows(foldersData);
	}, [foldersData]);

	const columns = useMemo(
		() => [
			{
				key: "folder",
				header: t("projects.column.folder"),
				render: (item: FolderRowView) => (
					<div
						className="stats-font-medium stats-text-primary truncate max-w-[440px]"
						title={item.folder || t("projects.root")}
					>
						{item.folder || t("projects.root")}
					</div>
				),
			},
			{
				key: "totalRequests",
				header: t("projects.column.requests"),
				numeric: true,
				render: (item: FolderRowView) => (
					<div className="stats-text-right">
						<div className="font-mono">{formatInteger(item.totalRequests)}</div>
						<div className="stats-progress-bar-track mt-1 ml-auto w-24 h-1">
							<div
								className="stats-progress-bar-fill"
								data-variant="link"
								style={{ width: `${item.requestsPercentage}%` }}
							/>
						</div>
					</div>
				),
			},
			{
				key: "totalCost",
				header: t("projects.column.cost"),
				numeric: true,
				render: (item: FolderRowView) => (
					<div className="stats-text-right">
						<div className="font-mono">{formatCost(item.totalCost, undefined, locale)}</div>
						<div className="stats-progress-bar-track mt-1 ml-auto w-24 h-1">
							<div
								className="stats-progress-bar-fill"
								data-variant="success"
								style={{ width: `${item.costPercentage}%` }}
							/>
						</div>
					</div>
				),
			},
			{
				key: "totalTokens",
				header: t("projects.column.tokens"),
				numeric: true,
				render: (item: FolderRowView) => (
					<div className="font-mono">{formatInteger(item.totalInputTokens + item.totalOutputTokens)}</div>
				),
			},
			{
				key: "cacheRate",
				header: t("projects.column.cacheRate"),
				numeric: true,
				render: (item: FolderRowView) => (
					<span className="stats-text-success font-medium">{formatPercent(item.cacheRate)}</span>
				),
			},
			{
				key: "errorRate",
				header: t("projects.column.errorRate"),
				numeric: true,
				render: (item: FolderRowView) => (
					<StatusPill variant={item.errorRate > 0.1 ? "danger" : item.errorRate > 0 ? "warning" : "success"}>
						{formatPercent(item.errorRate)}
					</StatusPill>
				),
			},
			{
				key: "avgDuration",
				header: t("projects.column.avgDuration"),
				numeric: true,
				render: (item: FolderRowView) => formatDurationMs(item.avgDuration),
			},
		],
		[t],
	);

	const renderMobileCard = (item: FolderRowView) => (
		<div className="stats-mobile-card">
			<div className="stats-mobile-card-header mb-2">
				<div className="stats-font-semibold stats-text-primary">{item.folder || t("projects.root")}</div>
				<StatusPill variant={item.errorRate > 0.1 ? "danger" : item.errorRate > 0 ? "warning" : "success"}>
					{formatPercent(item.errorRate)} {t("projects.errSuffix")}
				</StatusPill>
			</div>
			<div className="stats-mobile-card-grid">
				<div>
					<div className="stats-mobile-card-label">{t("projects.column.requests")}</div>
					<div className="stats-mobile-card-value font-mono">{formatInteger(item.totalRequests)}</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("projects.column.cost")}</div>
					<div className="stats-mobile-card-value font-mono">{formatCost(item.totalCost, undefined, locale)}</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("projects.column.cacheRate")}</div>
					<div className="stats-mobile-card-value">{formatPercent(item.cacheRate)}</div>
				</div>
				<div>
					<div className="stats-mobile-card-label">{t("projects.column.avgDuration")}</div>
					<div className="stats-mobile-card-value">{formatDurationMs(item.avgDuration)}</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className="stats-route-container">
			<Panel title={t("projects.title")} subtitle={t("projects.subtitle")}>
				<AsyncBoundary loading={loading} error={error} data={foldersData} emptyText={t("projects.noFolders")}>
					<DataTable
						columns={columns}
						data={folderRows}
						keyExtractor={item => item.folder}
						renderMobileCard={renderMobileCard}
						emptyText={t("projects.noFolders")}
					/>
				</AsyncBoundary>
			</Panel>
		</div>
	);
}
