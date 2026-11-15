"use client";

import {
	AlertCircleIcon,
	CheckmarkCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/shared/lib/utils";

export type WorkspaceFeedback = {
	status: "success" | "error";
	message: string;
};

export function FeedbackBanner({ feedback }: { feedback: WorkspaceFeedback }) {
	const isError = feedback.status === "error";

	return (
		<div
			role={isError ? "alert" : "status"}
			className={cn(
				"flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
				isError
					? "border-destructive/20 bg-destructive/5"
					: "border-emerald-500/20 bg-emerald-500/5",
			)}
		>
			<HugeiconsIcon
				icon={isError ? AlertCircleIcon : CheckmarkCircleIcon}
				className={cn(
					"mt-0.5 size-4 shrink-0",
					isError
						? "text-destructive"
						: "text-emerald-600 dark:text-emerald-400",
				)}
				aria-hidden="true"
			/>
			<p className="min-w-0">{feedback.message}</p>
		</div>
	);
}
