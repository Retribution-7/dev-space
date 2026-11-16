"use client";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/shared/lib/utils";

import type { RequestDraft } from "../model/types";

import { CollectionsPanel } from "./collections-panel";

type WorkspaceSidebarProps = {
	isMobile: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	draft: RequestDraft;
	onOpenRequest: (draft: RequestDraft) => void;
	onSaved: () => void;
};

export function WorkspaceSidebar({
	isMobile,
	open,
	onOpenChange,
	draft,
	onOpenRequest,
	onSaved,
}: WorkspaceSidebarProps) {
	const content = (
		<CollectionsPanel
			className="h-full"
			draft={draft}
			onRestore={onOpenRequest}
			onSaved={onSaved}
		/>
	);

	if (isMobile) {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					side="left"
					className="w-80 max-w-[calc(100%-2rem)] overflow-y-auto p-0"
				>
					<SheetHeader className="sr-only">
						<SheetTitle>API Playground collections</SheetTitle>
						<SheetDescription>
							Navigate and manage saved request collections.
						</SheetDescription>
					</SheetHeader>
					{content}
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<aside
			className={cn(
				"hidden w-80 shrink-0 self-stretch border-r transition-[width] duration-200 md:block",
				!open && "w-0 overflow-hidden",
			)}
		>
			{content}
		</aside>
	);
}
