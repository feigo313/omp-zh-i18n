import { GitBranch } from "lucide-react";
import { getRequestDetails } from "../api";
import {
	formatCost,
	formatDurationMs,
	formatFolder,
	formatInteger,
	formatMessageCost,
	formatRelativeTime,
	formatTimestamp,
	formatTokensPerSecond,
} from "../data/formatters";
import { useQuery } from "../data/query";
import { buildHash, parseHash } from "../data/useHashRoute";
import { type RequestStatus, requestStatus } from "../data/view-models";
import { type TranslationFn, useTranslation } from "../i18n";
import type { RequestDetails } from "../types";
import { Badge, type Tone } from "./Badge";
import { Drawer, KeyValues } from "./Drawer";
import { JsonBlock } from "./JsonBlock";
import { ErrorState, Skeleton } from "./States";
import "./request-drawer.css";

/** Tone per request outcome; the labels resolve through the dashboard translator. */
export const REQUEST_STATUS: Record<RequestStatus, { labelKey: string; tone: Tone }> = {
	ok: { labelKey: "common.success", tone: "ok" },
	aborted: { labelKey: "detail.aborted", tone: "warn" },
	failed: { labelKey: "common.failed", tone: "bad" },
};

/** Localized label for one request outcome. */
export function requestStatusLabel(t: TranslationFn, status: RequestStatus): string {
	return t(REQUEST_STATUS[status].labelKey);
}

export interface RequestDrawerProps {
	id: number | null;
	onClose: () => void;
}

/** Full detail sheet for one model request: timing, tokens, cost, ids, error, and the raw session entry. */
export function RequestDrawer({ id, onClose }: RequestDrawerProps) {
	const { t } = useTranslation();
	const query = useQuery(["request", id], () => getRequestDetails(id ?? 0), { enabled: id !== null });
	// Never show the previous request's payload under a new id.
	const details = query.stale ? null : query.data;
	const status = details ? REQUEST_STATUS[requestStatus(details)] : null;

	return (
		<Drawer
			open={id !== null}
			onClose={onClose}
			width={620}
			title={details ? <span className="mono">{details.model}</span> : t("detail.requestTitle")}
			subtitle={
				details ? (
					<>
						{details.provider} ·{" "}
						<span title={formatTimestamp(details.timestamp)}>{formatRelativeTime(details.timestamp)}</span>
					</>
				) : id !== null ? (
					<span className="mono">#{id}</span>
				) : undefined
			}
			actions={
				details && status ? (
					<div className="row" style={{ gap: 6 }}>
						<a
							className="btn"
							data-size="sm"
							data-variant="ghost"
							href={buildHash({
								...parseHash(window.location.hash),
								section: "traces",
								session: details.sessionFile,
							})}
							onClick={onClose}
							title={t("detail.traceTooltip")}
						>
							<GitBranch size={13} /> {t("detail.trace")}
						</a>
						<Badge tone={status.tone}>{requestStatusLabel(t, requestStatus(details))}</Badge>
					</div>
				) : undefined
			}
		>
			{details ? (
				<RequestDetailsBody details={details} aborted={requestStatus(details) === "aborted"} />
			) : query.error ? (
				<ErrorState error={query.error} onRetry={query.refetch} />
			) : (
				<div className="stack" style={{ gap: 12 }}>
					<Skeleton height={56} />
					<Skeleton height={120} />
					<Skeleton height={120} />
					<Skeleton height={220} />
				</div>
			)}
		</Drawer>
	);
}

function RequestDetailsBody({ details, aborted }: { details: RequestDetails; aborted: boolean }) {
	const { t } = useTranslation();
	const { usage } = details;
	const throughput =
		details.duration !== null && details.duration > 0 && usage.output > 0
			? (usage.output * 1000) / details.duration
			: null;
	// The stats row as ingested, without the session payload shown separately below.
	const { messages, output, ...row } = details;

	return (
		<>
			{details.errorMessage && (
				<section className="request-drawer-error" data-tone={aborted ? "warn" : "bad"} role="note">
					<div className="request-drawer-error-label">{aborted ? t("detail.aborted") : t("common.error")}</div>
					<pre className="request-drawer-error-text">{details.errorMessage}</pre>
				</section>
			)}

			<section>
				<div className="section-label">{t("detail.timing")}</div>
				<KeyValues
					items={[
						{ key: "at", label: t("common.started"), value: formatTimestamp(details.timestamp) },
						{ key: "duration", label: t("detail.duration"), value: formatDurationMs(details.duration) },
						{ key: "ttft", label: t("detail.ttft"), value: formatDurationMs(details.ttft) },
						{ key: "tps", label: t("common.tokensPerSec"), value: formatTokensPerSecond(throughput) },
					]}
				/>
			</section>

			<section>
				<div className="section-label">{t("common.tokens")}</div>
				<KeyValues
					items={[
						{ key: "input", label: t("common.uncachedInput"), value: formatInteger(usage.input) },
						{ key: "cacheRead", label: t("common.cacheRead"), value: formatInteger(usage.cacheRead) },
						{ key: "cacheWrite", label: t("common.cacheWrite"), value: formatInteger(usage.cacheWrite) },
						{ key: "output", label: t("common.output"), value: formatInteger(usage.output) },
						{ key: "total", label: t("detail.totalTokens"), value: formatInteger(usage.totalTokens) },
						{
							key: "premium",
							label: t("metric.premiumRequests"),
							value: formatInteger(Math.round((usage.premiumRequests ?? 0) * 100) / 100),
						},
					]}
				/>
			</section>

			<section>
				<div className="section-label">{t("costs.apiEquivalent")}</div>
				<KeyValues
					items={[
						{ key: "total", label: t("costs.total"), value: formatMessageCost(details, 4) },
						{ key: "input", label: t("common.input"), value: formatCost(usage.cost.input, 4) },
						{ key: "cacheRead", label: t("common.cacheRead"), value: formatCost(usage.cost.cacheRead, 4) },
						{ key: "cacheWrite", label: t("common.cacheWrite"), value: formatCost(usage.cost.cacheWrite, 4) },
						{ key: "output", label: t("common.output"), value: formatCost(usage.cost.output, 4) },
					]}
				/>
			</section>

			<section>
				<div className="section-label">{t("detail.identity")}</div>
				<KeyValues
					items={[
						{ key: "id", label: t("detail.id"), value: details.id ?? "–" },
						{ key: "entry", label: t("detail.entryId"), value: details.entryId },
						{ key: "stop", label: t("detail.stopReason"), value: details.stopReason },
						{ key: "api", label: "API", value: details.api },
						{
							key: "project",
							label: t("gain.project"),
							value: <span title={details.folder}>{formatFolder(details.folder)}</span>,
						},
					]}
				/>
				<div className="request-drawer-file">
					<span className="kv-key">{t("detail.sessionFile")}</span>
					<span className="kv-value">{details.sessionFile}</span>
				</div>
			</section>

			<JsonBlock data={output} title={t("detail.outputPayload")} />
			<JsonBlock data={messages} title={t("detail.rawMetadata")} initialCollapsed />
			<JsonBlock data={row} title={t("detail.statsRow")} initialCollapsed />
		</>
	);
}
