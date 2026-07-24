import { Inbox, type LucideIcon } from "lucide-react";
import { useTranslation } from "../i18n";

export interface EmptyStateProps {
	message?: string;
	icon?: LucideIcon;
	className?: string;
}

export function EmptyState({ message, icon: Icon = Inbox, className = "" }: EmptyStateProps) {
	const { t } = useTranslation();
	const displayMessage = message ?? t("common.noData");

	return (
		<div className={`stats-empty-state ${className}`}>
			<Icon size={24} className="stats-empty-state-icon" aria-hidden="true" />
			<p className="stats-empty-state-message">{displayMessage}</p>
		</div>
	);
}
