import {
	AlertCircleIcon,
	CheckmarkCircleIcon,
	InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import { cn } from "@/shared/lib/utils";

import type {
	RequestFeedback,
	RequestFeedbackTone,
} from "../model/request-feedback";

type RequestFeedbackBannerProps = {
	feedback: RequestFeedback;
};

const FEEDBACK_STYLES: Record<RequestFeedbackTone, string> = {
	success: "border-emerald-500/20 bg-emerald-500/5",
	error: "border-destructive/20 bg-destructive/5",
	warning: "border-amber-500/20 bg-amber-500/5",
	info: "border-border bg-muted/40",
};

const ICON_STYLES: Record<RequestFeedbackTone, string> = {
	success: "text-emerald-600 dark:text-emerald-400",
	error: "text-destructive",
	warning: "text-amber-600 dark:text-amber-400",
	info: "text-muted-foreground",
};

const FEEDBACK_ICONS: Record<RequestFeedbackTone, IconSvgElement> = {
	success: CheckmarkCircleIcon,
	error: AlertCircleIcon,
	warning: AlertCircleIcon,
	info: InformationCircleIcon,
};

export function RequestFeedbackBanner({
	feedback,
}: RequestFeedbackBannerProps) {
	const isError = feedback.tone === "error";

	return (
		<div
			role={isError ? "alert" : "status"}
			className={cn(
				"flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
				FEEDBACK_STYLES[feedback.tone],
			)}
		>
			<HugeiconsIcon
				icon={FEEDBACK_ICONS[feedback.tone]}
				className={cn("mt-0.5 size-4 shrink-0", ICON_STYLES[feedback.tone])}
				aria-hidden="true"
			/>
			<p className="min-w-0">{feedback.message}</p>
		</div>
	);
}
