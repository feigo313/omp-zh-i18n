import { Menu } from "lucide-react";
import { useEffect } from "react";
import { getLocale, setLocale, useTranslation } from "../i18n";
import type { TimeRange } from "../types";
import { refreshExchangeRate, useExchangeRate, useExchangeRateTimestamp } from "../useExchangeRate";
import { RangeControl } from "./RangeControl";
import type { DashboardSection } from "./routes";
import { getRoutes } from "./routes";
import { SyncButton } from "./SyncButton";
import { ThemeToggle } from "./ThemeToggle";

export interface TopBarProps {
	activeSection: DashboardSection;
	range: TimeRange;
	onRangeChange: (range: TimeRange) => void;
	updatedAt: number | null;
	onSyncStart?: () => void;
	onSyncComplete?: (result: { success: boolean }) => void;
	onMenuToggle?: () => void;
	className?: string;
}

export function TopBar({
	activeSection,
	range,
	onRangeChange,
	updatedAt,
	onSyncStart,
	onSyncComplete,
	onMenuToggle,
	className = "",
}: TopBarProps) {
	const { t } = useTranslation();
	const locale = getLocale();
	const exchangeRate = useExchangeRate();
	const rateTimestamp = useExchangeRateTimestamp();

	useEffect(() => {
		if (locale === "zh") refreshExchangeRate();
	}, [locale]);
	const routes = getRoutes(t);
	const currentRoute = routes.find(r => r.id === activeSection);
	const title = currentRoute?.label || t("topBar.observability");

	const formatLastUpdated = (time: number | null) => {
		if (!time) return t("topBar.notUpdated");
		const date = new Date(time);
		const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
		return t("topBar.updated", { time: timeStr });
	};

	return (
		<header className={`stats-top-bar ${className}`}>
			<div className="stats-top-bar-left">
				{onMenuToggle && (
					<button
						type="button"
						onClick={onMenuToggle}
						className="stats-mobile-menu-btn"
						aria-label={t("topBar.openMenu")}
					>
						<Menu size={20} />
					</button>
				)}
				<h1 className="stats-page-title">{title}</h1>
			</div>

			<div className="stats-top-bar-right">
				<div className="stats-top-bar-meta">
					<span
						className="stats-last-updated"
						title={updatedAt ? new Date(updatedAt).toLocaleString() : undefined}
					>
						{formatLastUpdated(updatedAt)}
					</span>
				</div>

				<RangeControl value={range} onChange={onRangeChange} />
				<select
					value={getLocale()}
					onChange={e => setLocale(e.target.value as "en" | "zh")}
					className="stats-language-select"
					aria-label={t("topBar.languageToggle")}
					title={t("topBar.languageToggle")}
				>
					<option value="en">English</option>
					<option value="zh">中文</option>
				</select>

				{locale === "zh" && (
					<div className="stats-exchange-rate">
						<span className="stats-text-muted stats-exchange-rate-label">{t("exchangeRate.label")}</span>
						<span className="stats-text-primary stats-exchange-rate-value">¥{exchangeRate.toFixed(4)}</span>
						{rateTimestamp > 0 && (
							<span
								className="stats-text-muted stats-exchange-rate-timestamp"
								title={new Date(rateTimestamp).toLocaleString()}
							>
								{t("exchangeRate.updated", {
									time: new Date(rateTimestamp).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									}),
								})}
							</span>
						)}
						<button
							type="button"
							onClick={() => refreshExchangeRate()}
							className="stats-button stats-button-secondary stats-exchange-rate-refresh"
							title={t("exchangeRate.refresh")}
						>
							{t("exchangeRate.refresh")}
						</button>
					</div>
				)}

				<ThemeToggle />

				<SyncButton onSyncStart={onSyncStart} onSyncComplete={onSyncComplete} />
			</div>
		</header>
	);
}
