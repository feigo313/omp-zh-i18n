import { Activity, AlertCircle, Coins, Cpu, Folder, LayoutDashboard, Smile, TrendingUp, Wrench } from "lucide-react";
import type React from "react";

export type DashboardSection =
	| "overview"
	| "requests"
	| "errors"
	| "models"
	| "tools"
	| "costs"
	| "behavior"
	| "projects"
	| "gain";

export interface DashboardRoute {
	id: DashboardSection;
	label: string;
	shortLabel?: string;
	icon: React.ComponentType<{ size?: number; className?: string }>;
}

export function getRoutes(t: (key: string) => string): DashboardRoute[] {
	return [
		{
			id: "overview",
			label: t("nav.overview"),
			icon: LayoutDashboard,
		},
		{
			id: "requests",
			label: t("nav.requests"),
			icon: Activity,
		},
		{
			id: "errors",
			label: t("nav.errors"),
			icon: AlertCircle,
		},
		{
			id: "models",
			label: t("nav.models"),
			icon: Cpu,
		},
		{
			id: "tools",
			label: t("nav.tools"),
			icon: Wrench,
		},
		{
			id: "costs",
			label: t("nav.costs"),
			icon: Coins,
		},
		{
			id: "behavior",
			shortLabel: t("nav.behavior"),
			label: t("nav.behavior"),
			icon: Smile,
		},
		{
			id: "projects",
			label: t("nav.projects"),
			icon: Folder,
		},
		{
			id: "gain",
			label: t("nav.gain"),
			icon: TrendingUp,
		},
	];
}

export const routes: DashboardRoute[] = [
	{
		id: "overview",
		label: "Overview",
		icon: LayoutDashboard,
	},
	{
		id: "requests",
		label: "Requests",
		icon: Activity,
	},
	{
		id: "errors",
		label: "Errors",
		icon: AlertCircle,
	},
	{
		id: "models",
		label: "Models",
		icon: Cpu,
	},
	{
		id: "tools",
		label: "Tools",
		icon: Wrench,
	},
	{
		id: "costs",
		label: "Costs",
		icon: Coins,
	},
	{
		id: "behavior",
		label: "Behavior",
		shortLabel: "Behavior",
		icon: Smile,
	},
	{
		id: "projects",
		label: "Projects",
		icon: Folder,
	},
	{
		id: "gain",
		label: "Gain",
		icon: TrendingUp,
	},
];
