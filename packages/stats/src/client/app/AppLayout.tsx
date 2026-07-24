import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "../i18n";
import type { TimeRange } from "../types";
import { NavRail } from "./NavRail";
import type { DashboardSection } from "./routes";
import { TopBar } from "./TopBar";

export interface AppLayoutProps {
	activeSection: DashboardSection;
	onSectionChange: (section: DashboardSection) => void;
	range: TimeRange;
	onRangeChange: (range: TimeRange) => void;
	updatedAt: number | null;
	onSyncStart?: () => void;
	onSyncComplete?: (result: { success: boolean }) => void;
	children: React.ReactNode;
}

export function AppLayout({
	activeSection,
	onSectionChange,
	range,
	onRangeChange,
	updatedAt,
	onSyncStart,
	onSyncComplete,
	children,
}: AppLayoutProps) {
	const { t } = useTranslation();
	const [menuOpen, setMenuOpen] = useState(false);
	const [navCollapsed, setNavCollapsed] = useState(() => {
		if (typeof localStorage === "undefined") return false;
		return localStorage.getItem("omp-stats-nav-collapsed") === "true";
	});

	const handleToggleCollapse = () => {
		setNavCollapsed(prev => {
			const next = !prev;
			if (typeof localStorage !== "undefined") {
				try {
					localStorage.setItem("omp-stats-nav-collapsed", String(next));
				} catch {
					// localStorage unavailable
				}
			}
			return next;
		});
	};

	const handleSectionChange = (section: DashboardSection) => {
		onSectionChange(section);
		setMenuOpen(false);
	};

	return (
		<div className="stats-app-container">
			{/* Desktop Rail */}
			<NavRail
				activeSection={activeSection}
				onSectionChange={handleSectionChange}
				className="stats-desktop-nav"
				collapsed={navCollapsed}
				onToggleCollapse={handleToggleCollapse}
			/>

			{/* Mobile Nav Drawer */}
			{menuOpen && (
				<div className="stats-mobile-drawer-overlay" onClick={() => setMenuOpen(false)} role="presentation">
					<div
						className="stats-mobile-drawer"
						onClick={e => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-label={t("nav.menu")}
					>
						<div className="stats-mobile-drawer-header">
							<button
								type="button"
								onClick={() => setMenuOpen(false)}
								className="stats-drawer-close-btn"
								aria-label={t("nav.closeMenu")}
							>
								<X size={18} />
							</button>
						</div>
						<NavRail
							activeSection={activeSection}
							onSectionChange={handleSectionChange}
							className="stats-mobile-nav"
						/>
					</div>
				</div>
			)}

			{/* Main Layout Pane */}
			<div className="stats-main-pane">
				<TopBar
					activeSection={activeSection}
					range={range}
					onRangeChange={onRangeChange}
					updatedAt={updatedAt}
					onSyncStart={onSyncStart}
					onSyncComplete={onSyncComplete}
					onMenuToggle={() => setMenuOpen(true)}
				/>

				<main className="stats-content-area">
					<div className="stats-content-inner">{children}</div>
				</main>
			</div>
		</div>
	);
}
