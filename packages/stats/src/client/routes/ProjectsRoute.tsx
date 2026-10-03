import { useDeferredValue, useMemo, useState } from "react";
import { getFolderStats } from "../api";
import { BarList } from "../charts";
import {
	formatCompact,
	formatDurationMs,
	formatEstimatedCost,
	formatFolder,
	formatInteger,
	formatPercent,
	formatRelativeTime,
} from "../data/formatters";
import { useQuery } from "../data/query";
import { rangeMeta } from "../data/range";
import { buildFolderRows, type FolderRowView } from "../data/view-models";
import { type Locale, type TranslationFn, useTranslation } from "../i18n";
import type { TimeRange } from "../types";
import {
	Badge,
	Card,
	ChartSkeleton,
	type Column,
	EmptyState,
	errorRateTone,
	MeterCell,
	PageHeader,
	QueryView,
	SearchInput,
	Stat,
	StatGrid,
	Table,
	TableSkeleton,
} from "../ui";
import "./projects.css";

export interface ProjectsRouteProps {
	active: boolean;
	range: TimeRange;
}

/** Rows rendered before "Show all": keeps the first paint cheap with tens of thousands of folders. */
const TABLE_LIMIT = 100;
const TOP_LIMIT = 8;

export function ProjectsRoute({ active, range }: ProjectsRouteProps) {
	const { t, locale } = useTranslation();
	const folders = useQuery(["projects", range], () => getFolderStats(range), { enabled: active });
	const [search, setSearch] = useState("");
	// Benchmarks and scratch sessions can leave tens of thousands of one-off temp folders; hide them by default.
	const [hideTemporary, setHideTemporary] = useState(true);
	const query = useDeferredValue(search.trim().toLowerCase());
	const meta = rangeMeta(range);

	const view = useMemo(() => buildFolderRows(folders.data ?? []), [folders.data]);
	const scoped = useMemo(
		() => (hideTemporary ? view.rows.filter(row => !row.temporary) : view.rows),
		[view, hideTemporary],
	);
	const matching = useMemo(
		() => (query ? scoped.filter(row => row.folder.toLowerCase().includes(query)) : scoped),
		[scoped, query],
	);
	const top = useMemo(
		() => ({
			cost: [...scoped].sort((a, b) => b.totalCost - a.totalCost).slice(0, TOP_LIMIT),
			requests: [...scoped].sort((a, b) => b.totalRequests - a.totalRequests).slice(0, TOP_LIMIT),
		}),
		[scoped],
	);
	const topEmpty = (
		<EmptyState title={view.rows.length === 0 ? t("projects.noFoldersInRange") : t("projects.onlyTemporary")} />
	);
	// Meter scales follow the whole range so a bar's length does not change while filtering.
	const columns = useMemo(() => folderColumns(view.maxRequests, view.maxCost, t, locale), [view, t, locale]);

	return (
		<div className="page">
			<PageHeader
				title={t("nav.section.projects")}
				description={t("projects.pageDescription", { window: meta.windowLabel })}
			/>

			<QueryView query={folders} skeleton={<ChartSkeleton height={96} />}>
				{() => (
					<div data-stale={folders.stale}>
						<StatGrid min={180}>
							<Stat
								label={t("projects.folders")}
								value={formatInteger(view.rows.length)}
								hint={
									view.temporaryCount > 0
										? t("projects.hint.temporary", { count: formatInteger(view.temporaryCount) })
										: undefined
								}
							/>
							<Stat
								label={t("common.requests")}
								value={formatInteger(view.totalRequests)}
								hint={t("common.failedCount", { count: formatInteger(view.failedRequests) })}
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
							<Stat
								label={t("common.conversationTotal")}
								title={t("common.tokenMixTooltip")}
								value={formatCompact(view.conversationTokens, locale)}
							/>
							<Stat
								label={t("common.cacheRate")}
								title={t("projects.cacheRateTooltip")}
								value={formatPercent(view.cacheRate)}
							/>
						</StatGrid>
					</div>
				)}
			</QueryView>

			<div className="grid grid-2">
				<Card
					index={1}
					title={t("projects.topByCost")}
					description={t("projects.topByCostDescription")}
					stale={folders.stale}
				>
					<QueryView
						query={folders}
						skeleton={<ChartSkeleton height={236} />}
						isEmpty={() => top.cost.length === 0}
						empty={topEmpty}
					>
						{() => (
							<BarList
								items={top.cost.map(row => ({
									key: row.folder,
									label: <span className="mono">{formatFolder(row.folder)}</span>,
									value: row.totalCost,
									display: `${formatEstimatedCost(row.totalCost, row.unpricedRequests)} · ${formatPercent(row.costShare)}`,
									color: "var(--chart-secondary)",
								}))}
								onSelect={setSearch}
							/>
						)}
					</QueryView>
				</Card>
				<Card
					index={2}
					title={t("projects.topByRequests")}
					description={t("projects.topByRequestsDescription")}
					stale={folders.stale}
				>
					<QueryView
						query={folders}
						skeleton={<ChartSkeleton height={236} />}
						isEmpty={() => top.requests.length === 0}
						empty={topEmpty}
					>
						{() => (
							<BarList
								items={top.requests.map(row => ({
									key: row.folder,
									label: <span className="mono">{formatFolder(row.folder)}</span>,
									value: row.totalRequests,
									display: `${formatInteger(row.totalRequests)} · ${formatPercent(row.requestShare)}`,
								}))}
								onSelect={setSearch}
							/>
						)}
					</QueryView>
				</Card>
			</div>

			<Card
				index={3}
				title={t("projects.folders")}
				description={
					folders.data
						? matching.length === view.rows.length
							? t("projects.folderCount", { count: view.rows.length })
							: t("projects.folderCountOf", {
									count: formatInteger(matching.length),
									total: formatInteger(view.rows.length),
								})
						: undefined
				}
				actions={
					<>
						{view.temporaryCount > 0 && (
							<label className="check" title={t("projects.temporaryTitle")}>
								<input
									type="checkbox"
									checked={hideTemporary}
									onChange={e => setHideTemporary(e.target.checked)}
								/>
								{t("projects.hideTemporary", { count: formatInteger(view.temporaryCount) })}
							</label>
						)}
						<SearchInput
							value={search}
							onChange={setSearch}
							placeholder={t("projects.searchPlaceholder")}
							width={240}
						/>
					</>
				}
				flush
				stale={folders.stale}
			>
				<QueryView query={folders} skeleton={<TableSkeleton rows={10} />}>
					{() => (
						<Table
							rows={matching}
							rowKey={row => row.folder}
							columns={columns}
							initialSort={{ key: "cost", dir: "desc" }}
							limit={TABLE_LIMIT}
							dense
							empty={
								<EmptyState
									title={
										view.rows.length === 0 ? t("projects.noFoldersInRange") : t("projects.noFoldersMatch")
									}
									hint={
										view.rows.length === 0
											? t("common.hint.tryLongerRange")
											: hideTemporary && view.temporaryCount > 0
												? t("projects.temporaryHidden")
												: undefined
									}
								/>
							}
						/>
					)}
				</QueryView>
			</Card>
		</div>
	);
}

function folderColumns(
	maxRequests: number,
	maxCost: number,
	t: TranslationFn,
	locale: Locale,
): Column<FolderRowView>[] {
	return [
		{
			key: "folder",
			header: t("projects.folder"),
			sort: row => row.folder,
			render: row => (
				<span className="row projects-folder" title={row.folder || "(root)"}>
					<span className="mono truncate">{formatFolder(row.folder)}</span>
					{row.temporary && <Badge>{t("projects.tempBadge")}</Badge>}
				</span>
			),
		},
		{
			key: "requests",
			header: t("common.requests"),
			align: "right",
			sort: row => row.totalRequests,
			render: row => (
				<span title={t("common.tooltip.shareOfRequests", { share: formatPercent(row.requestShare) })}>
					<MeterCell value={row.totalRequests} max={maxRequests} display={formatInteger(row.totalRequests)} />
				</span>
			),
		},
		{
			key: "cost",
			header: t("common.cost"),
			title: t("projects.title.apiEquivalent"),
			align: "right",
			sort: row => row.totalCost,
			render: row => (
				<span title={t("common.tooltip.shareOfCost", { share: formatPercent(row.costShare) })}>
					<MeterCell
						value={row.totalCost}
						max={maxCost}
						display={formatEstimatedCost(row.totalCost, row.unpricedRequests)}
						color="var(--chart-secondary)"
					/>
				</span>
			),
		},
		{
			key: "tokens",
			header: t("common.tokens"),
			title: t("common.tokenMixTooltip"),
			align: "right",
			sort: row => row.conversationTokens,
			render: row => (
				<span className="num" title={formatInteger(row.conversationTokens)}>
					{formatCompact(row.conversationTokens, locale)}
				</span>
			),
		},
		{
			key: "cacheRate",
			header: t("common.cacheRate"),
			title: t("common.cacheRateTooltip"),
			align: "right",
			sort: row => row.cacheRate,
			render: row => <span className="num">{formatPercent(row.cacheRate)}</span>,
		},
		{
			key: "cacheSavings",
			header: t("common.cacheSavings"),
			title: t("projects.cacheSavingsTooltip"),
			align: "right",
			sort: row => row.cacheSavings,
			render: row => (
				<span className={`num ${row.cacheSavings < 0 ? "tone-bad" : "muted"}`}>
					{formatPercent(row.cacheSavings)}
				</span>
			),
		},
		{
			key: "errorRate",
			header: t("common.errors"),
			align: "right",
			sort: row => row.errorRate,
			render: row => (
				<span title={t("common.failedCount", { count: formatInteger(row.failedRequests) })}>
					<Badge tone={row.failedRequests > 0 ? errorRateTone(row.errorRate) : "neutral"} mono>
						{formatPercent(row.errorRate)}
					</Badge>
				</span>
			),
		},
		{
			key: "duration",
			header: t("models.avgDuration"),
			align: "right",
			sort: row => row.avgDuration ?? -1,
			render: row => <span className="num">{formatDurationMs(row.avgDuration)}</span>,
		},
		{
			key: "last",
			header: t("common.lastActive"),
			align: "right",
			sort: row => row.lastTimestamp,
			render: row => <span className="dim">{formatRelativeTime(row.lastTimestamp, locale)}</span>,
		},
	];
}
