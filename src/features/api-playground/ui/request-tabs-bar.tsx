"use client";

import {
	Add01Icon,
	Cancel01Icon,
	SidebarLeftIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

import {
	getOpenRequestTabTitle,
	isRequestTabDirty,
	type OpenRequestTab,
} from "../model/request-workspace";

type RequestTabsBarProps = {
	tabs: OpenRequestTab[];
	activeTabId: string | null;
	onActivate: (id: string) => void;
	onClose: (id: string) => void;
	onCreate: () => void;
	onToggleSidebar: () => void;
};

export function RequestTabsBar({
	tabs,
	activeTabId,
	onActivate,
	onClose,
	onCreate,
	onToggleSidebar,
}: RequestTabsBarProps) {
	return (
		<div className="bg-muted/30 flex h-12 shrink-0 items-center gap-2 border-b px-4">
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="shrink-0"
				onClick={onToggleSidebar}
				aria-label="Toggle Collections and History sidebar"
				title="Toggle sidebar"
			>
				<HugeiconsIcon icon={SidebarLeftIcon} className="size-4" />
			</Button>

			<div
				role="tablist"
				aria-label="Open requests"
				className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto"
			>
				{tabs.map((tab) => {
					const isActive = tab.id === activeTabId;
					const isDirty = isRequestTabDirty(tab);

					return (
						<div key={tab.id} className="relative flex shrink-0 items-center">
							<button
								type="button"
								role="tab"
								aria-selected={isActive}
								onClick={() => onActivate(tab.id)}
								className={cn(
									"h-9 max-w-56 border border-b-0 px-3 pr-7 text-left text-xs transition-colors",
									isActive
										? "border-border bg-background text-foreground"
										: "text-muted-foreground hover:bg-muted/60 hover:text-foreground border-transparent",
								)}
								title={getOpenRequestTabTitle(tab)}
							>
								<span className="flex items-center gap-1.5">
									<span className="font-mono text-[0.65rem] font-semibold">
										{tab.draft.method}
									</span>
									<span className="truncate">
										{getOpenRequestTabTitle(tab)}
									</span>
									{isDirty ? (
										<span
											className="size-1.5 shrink-0 rounded-full bg-amber-500"
											aria-label="Unsaved changes"
										/>
									) : null}
								</span>
							</button>

							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								className="text-muted-foreground hover:text-foreground absolute right-1"
								onClick={() => onClose(tab.id)}
								aria-label={`Close ${getOpenRequestTabTitle(tab)}`}
							>
								<HugeiconsIcon icon={Cancel01Icon} className="size-3" />
							</Button>
						</div>
					);
				})}
			</div>

			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="shrink-0"
				onClick={onCreate}
				aria-label="New request"
				title="New request"
			>
				<HugeiconsIcon icon={Add01Icon} className="size-4" />
			</Button>
		</div>
	);
}
