import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "../i18n";
import { type DashboardSection, getRoutes } from "./routes";

export interface NavRailProps {
	activeSection: DashboardSection;
	onSectionChange: (section: DashboardSection) => void;
	className?: string;
	collapsed?: boolean;
	onToggleCollapse?: () => void;
}

export function NavRail({
	activeSection,
	onSectionChange,
	className = "",
	collapsed = false,
	onToggleCollapse,
}: NavRailProps) {
	const { t } = useTranslation();
	const routes = getRoutes(t);

	return (
		<aside className={`stats-nav-rail ${className} ${collapsed ? "stats-nav-rail-collapsed" : ""}`}>
			<div className="stats-nav-rail-header">
				{!collapsed && (
					<div className="stats-logo-container">
						<span className="stats-logo-text">OH MY PI</span>
						<span className="stats-logo-subtext">{t("nav.observability")}</span>
					</div>
				)}
				{onToggleCollapse && (
					<button
						type="button"
						onClick={onToggleCollapse}
						className="stats-nav-rail-collapse-btn"
						aria-label={collapsed ? t("nav.expandMenu") : t("nav.collapseMenu")}
						title={collapsed ? t("nav.expandMenu") : t("nav.collapseMenu")}
					>
						{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
					</button>
				)}
			</div>

			<nav className="stats-nav-rail-menu">
				{routes.map(route => {
					const isActive = route.id === activeSection;
					const Icon = route.icon;
					return (
						<button
							key={route.id}
							type="button"
							onClick={() => onSectionChange(route.id)}
							className="stats-nav-rail-item"
							data-active={isActive ? "true" : "false"}
							aria-current={isActive ? "page" : undefined}
							title={collapsed ? route.label : undefined}
						>
							<Icon size={16} className="stats-nav-rail-item-icon" />
							{!collapsed && <span className="stats-nav-rail-item-label">{route.label}</span>}
						</button>
					);
				})}
			</nav>

			{!collapsed && (
				<div className="stats-nav-rail-footer">
					<span className="stats-version-tag">{t("nav.version", { version: "1.0.0" })}</span>
				</div>
			)}
		</aside>
	);
}
