"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

type EmptyStateProps = {
	icon: IconSvgElement;
	title: string;
	description: string;
	action?: React.ReactNode;
	className?: string;
};

/**
 * Shared empty state used across panels so icon plates, typography and the
 * vertical rhythm stay identical everywhere.
 */
export function EmptyState({
	icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 px-6 py-10 text-center",
				className,
			)}
		>
			<span className="bg-muted text-muted-foreground grid size-12 shrink-0 place-items-center rounded-full">
				<HugeiconsIcon icon={icon} className="size-5" aria-hidden="true" />
			</span>

			<div className="flex max-w-md flex-col items-center gap-1">
				<p className="text-sm font-medium">{title}</p>
				<p className="text-muted-foreground text-xs">{description}</p>
			</div>

			{action ? <div className="mt-1">{action}</div> : null}
		</div>
	);
}
