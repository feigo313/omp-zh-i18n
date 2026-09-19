import { useTranslation } from "../i18n";

export interface PaginationProps {
	currentPage: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, pageSize, total, onPageChange }: PaginationProps) {
	const { t } = useTranslation();
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	if (totalPages <= 1) return null;

	// Build a compact page range: [1, ..., current-1, current, current+1, ..., last]
	const pages: Array<number | "ellipsis"> = [];
	pages.push(1);
	const rangeStart = Math.max(2, currentPage - 1);
	const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
	if (rangeStart > 2) pages.push("ellipsis");
	for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
	if (rangeEnd < totalPages - 1) pages.push("ellipsis");
	if (totalPages > 1) pages.push(totalPages);

	return (
		<nav className="flex items-center justify-center gap-1 mt-4 flex-wrap" aria-label={t("pagination.navigation")}>
			<span className="text-xs text-[var(--text-muted)] mr-2">
				{t("pagination.pageInfo", { current: String(currentPage), total: String(totalPages) })}
			</span>
			<button
				className="stats-pagination-btn"
				disabled={currentPage <= 1}
				onClick={() => onPageChange(currentPage - 1)}
				aria-label={t("pagination.previous")}
			>
				‹
			</button>
			{pages.map((page, i) =>
				page === "ellipsis" ? (
					<span key={`ellipsis-${i}`} className="px-1 text-[var(--text-muted)] text-sm">
						…
					</span>
				) : (
					<button
						key={page}
						className={`stats-pagination-btn ${page === currentPage ? "stats-pagination-btn-active" : ""}`}
						onClick={() => onPageChange(page)}
						aria-current={page === currentPage ? "page" : undefined}
						aria-label={t("pagination.goToPage", { page: String(page) })}
					>
						{page}
					</button>
				),
			)}
			<button
				className="stats-pagination-btn"
				disabled={currentPage >= totalPages}
				onClick={() => onPageChange(currentPage + 1)}
				aria-label={t("pagination.next")}
			>
				›
			</button>
		</nav>
	);
}
