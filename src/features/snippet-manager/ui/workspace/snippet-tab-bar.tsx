"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

import {
	getTabLabel,
	isTabDirty,
	type SnippetTab,
} from "../../model/snippets-workspace";

type SnippetTabBarProps = {
	tabs: SnippetTab[];
	activeTabId: string | null;
	onSelect: (tabId: string) => void;
	onClose: (tabId: string) => void;
};

export function SnippetTabBar({
	tabs,
	activeTabId,
	onSelect,
	onClose,
}: SnippetTabBarProps) {
	if (tabs.length === 0) {
		return <div className="bg-muted/30 h-10 shrink-0 border-b" />;
	}

	return (
		<div
			role="tablist"
			aria-label="Open snippets"
			className="bg-muted/30 flex h-10 shrink-0 items-stretch overflow-x-auto border-b"
		>
			{tabs.map((tab) => {
				const isActive = tab.tabId === activeTabId;
				const label = getTabLabel(tab);
				const isDirty = isTabDirty(tab);

				return (
					<div
						key={tab.tabId}
						className={cn(
							"flex shrink-0 items-center gap-1 border-r px-1 py-1",
							isActive
								? "bg-card text-foreground"
								: "text-muted-foreground hover:bg-muted/60",
						)}
					>
						<button
							type="button"
							role="tab"
							id={`snippet-tab-${tab.tabId}`}
							aria-selected={isActive}
							tabIndex={isActive ? 0 : -1}
							onClick={() => onSelect(tab.tabId)}
							className="focus-visible:ring-ring/50 flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm focus-visible:ring-2 focus-visible:outline-none"
						>
							<span className="max-w-44 truncate">{label}</span>
							{isDirty ? (
								<>
									<span
										className="bg-primary size-1.5 shrink-0 rounded-full"
										aria-hidden="true"
									/>
									<span className="sr-only">Unsaved changes</span>
								</>
							) : null}
						</button>

						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							className="text-muted-foreground hover:text-foreground"
							title="Close tab"
							aria-label={`Close ${label}`}
							onClick={() => onClose(tab.tabId)}
						>
							<HugeiconsIcon
								icon={Cancel01Icon}
								className="size-3"
								aria-hidden="true"
							/>
						</Button>
					</div>
				);
			})}
		</div>
	);
}
