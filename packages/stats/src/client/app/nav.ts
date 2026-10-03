import {
	Activity,
	CircleAlert,
	Coins,
	Cpu,
	FolderGit2,
	Frown,
	LayoutGrid,
	type LucideIcon,
	PlugZap,
	Sparkles,
	SquareChartGantt,
	Wrench,
} from "lucide-react";

export type DashboardSection =
	| "overview"
	| "models"
	| "providers"
	| "costs"
	| "requests"
	| "errors"
	| "traces"
	| "tools"
	| "frustration"
	| "projects"
	| "gain";

export interface NavItem {
	id: DashboardSection;
	label: string;
	/** Translation key for `label`; rendered through `t()` by the shell. */
	labelKey: string;
	icon: LucideIcon;
	/** Second key of the `g <key>` jump shortcut. */
	hotkey: string;
}

export interface NavGroup {
	heading: string;
	/** Translation key for `heading`; rendered through `t()` by the shell. */
	headingKey: string;
	items: readonly NavItem[];
}

/** Sidebar structure; the order here is the order on screen. */
export const NAV: readonly NavGroup[] = [
	{
		heading: "Usage",
		headingKey: "nav.group.usage",
		items: [
			{ id: "overview", label: "Overview", labelKey: "nav.section.overview", icon: LayoutGrid, hotkey: "o" },
			{ id: "models", label: "Models", labelKey: "nav.section.models", icon: Cpu, hotkey: "m" },
			{ id: "providers", label: "Providers", labelKey: "nav.section.providers", icon: PlugZap, hotkey: "p" },
			{ id: "costs", label: "Costs", labelKey: "nav.section.costs", icon: Coins, hotkey: "c" },
		],
	},
	{
		heading: "Activity",
		headingKey: "nav.group.activity",
		items: [
			{ id: "requests", label: "Requests", labelKey: "nav.section.requests", icon: Activity, hotkey: "r" },
			{ id: "errors", label: "Errors", labelKey: "nav.section.errors", icon: CircleAlert, hotkey: "e" },
			{ id: "traces", label: "Traces", labelKey: "nav.section.traces", icon: SquareChartGantt, hotkey: "t" },
		],
	},
	{
		heading: "Insights",
		headingKey: "nav.group.insights",
		items: [
			{ id: "tools", label: "Tools", labelKey: "nav.section.tools", icon: Wrench, hotkey: "l" },
			{ id: "frustration", label: "Frustration", labelKey: "nav.section.frustration", icon: Frown, hotkey: "f" },
			{ id: "projects", label: "Projects", labelKey: "nav.section.projects", icon: FolderGit2, hotkey: "j" },
			{ id: "gain", label: "Gain", labelKey: "nav.section.gain", icon: Sparkles, hotkey: "g" },
		],
	},
];

export const NAV_ITEMS: readonly NavItem[] = NAV.flatMap(group => group.items);

export const SECTIONS: readonly DashboardSection[] = NAV_ITEMS.map(item => item.id);

export function navItem(section: DashboardSection): NavItem {
	return NAV_ITEMS.find(item => item.id === section) ?? NAV_ITEMS[0];
}
