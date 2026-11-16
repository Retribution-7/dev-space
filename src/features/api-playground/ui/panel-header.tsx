"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

type PanelHeaderProps = {
	icon: IconSvgElement;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
};

/**
 * Shared panel header used by Collections, History and Response so their
 * heights, icon plates and dividers stay aligned across the workspace.
 */
export function PanelHeader({
	icon,
	title,
	description,
	action,
	className,
}: PanelHeaderProps) {
	return (
		<div
			className={cn(
				"flex h-12 shrink-0 items-center gap-3 border-b px-4",
				className,
			)}
		>
			<span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
				<HugeiconsIcon icon={icon} className="size-4" aria-hidden="true" />
			</span>

			<div className="flex min-w-0 flex-1 items-baseline gap-2">
				<h3 className="truncate text-sm font-medium">{title}</h3>
				{description ? (
					<p className="text-muted-foreground hidden truncate text-xs lg:block">
						{description}
					</p>
				) : null}
			</div>

			{action ? (
				<div className="ml-auto flex shrink-0 items-center">{action}</div>
			) : null}
		</div>
	);
}
