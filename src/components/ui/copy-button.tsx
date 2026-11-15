"use client";

import {
	AlertCircleIcon,
	CheckmarkCircleIcon,
	Copy01Icon,
	InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

type CopyStatus = "idle" | "success" | "error" | "empty";

type CopyButtonProps = {
	getValue: () => string;
	label?: string;
	copiedLabel?: string;
	errorLabel?: string;
	emptyLabel?: string;
	ariaLabel?: string;
	variant?: React.ComponentProps<typeof Button>["variant"];
	size?: React.ComponentProps<typeof Button>["size"];
	className?: string;
};

type CopyStatusStyle = {
	icon: IconSvgElement;
	iconClassName?: string;
};

const COPY_FEEDBACK_DURATION = 2_000;

const COPY_LIVE_MESSAGES: Record<CopyStatus, string> = {
	idle: "",
	success: "Copied to clipboard.",
	error: "Could not copy to clipboard.",
	empty: "The content is empty. Nothing to copy.",
};

const COPY_STATUS_STYLES: Record<CopyStatus, CopyStatusStyle> = {
	idle: { icon: Copy01Icon },
	success: {
		icon: CheckmarkCircleIcon,
		iconClassName: "text-emerald-600 dark:text-emerald-400",
	},
	error: {
		icon: AlertCircleIcon,
		iconClassName: "text-destructive",
	},
	empty: {
		icon: InformationCircleIcon,
		iconClassName: "text-muted-foreground",
	},
};

export function CopyButton({
	getValue,
	label = "Copy",
	copiedLabel = "Copied",
	errorLabel = "Copy failed",
	emptyLabel = "Nothing to copy",
	ariaLabel,
	variant = "outline",
	size = "sm",
	className,
}: CopyButtonProps) {
	const [status, setStatus] = React.useState<CopyStatus>("idle");
	const resetTimerRef = React.useRef<number | null>(null);
	const operationIdRef = React.useRef(0);

	const clearResetTimer = React.useCallback(() => {
		if (resetTimerRef.current !== null) {
			window.clearTimeout(resetTimerRef.current);
			resetTimerRef.current = null;
		}
	}, []);

	React.useEffect(() => clearResetTimer, [clearResetTimer]);

	const scheduleReset = React.useCallback(() => {
		clearResetTimer();
		resetTimerRef.current = window.setTimeout(() => {
			resetTimerRef.current = null;
			setStatus("idle");
		}, COPY_FEEDBACK_DURATION);
	}, [clearResetTimer]);

	const handleCopy = React.useCallback(async () => {
		const operationId = operationIdRef.current + 1;
		operationIdRef.current = operationId;

		let value: string;

		try {
			value = getValue();
		} catch {
			setStatus("error");
			scheduleReset();
			return;
		}

		if (value.trim().length === 0) {
			setStatus("empty");
			scheduleReset();
			return;
		}

		try {
			const clipboard = navigator.clipboard;

			if (!clipboard) {
				throw new Error("Clipboard API is not available.");
			}

			await clipboard.writeText(value);

			if (operationId !== operationIdRef.current) {
				return;
			}

			setStatus("success");
		} catch {
			if (operationId !== operationIdRef.current) {
				return;
			}

			setStatus("error");
		}

		if (operationId === operationIdRef.current) {
			scheduleReset();
		}
	}, [getValue, scheduleReset]);

	const statusLabels: Record<CopyStatus, string> = {
		idle: label,
		success: copiedLabel,
		error: errorLabel,
		empty: emptyLabel,
	};
	const statusStyle = COPY_STATUS_STYLES[status];
	const statusLabel = statusLabels[status];
	const liveMessage = COPY_LIVE_MESSAGES[status];

	return (
		<>
			<Button
				type="button"
				variant={variant}
				size={size}
				className={className}
				aria-label={ariaLabel}
				title={ariaLabel}
				onClick={() => void handleCopy()}
			>
				<HugeiconsIcon
					icon={statusStyle.icon}
					className={cn("size-3.5", statusStyle.iconClassName)}
					data-icon="inline-start"
					aria-hidden="true"
				/>
				{statusLabel}
			</Button>
			<span className="sr-only" role="status">
				{liveMessage}
			</span>
		</>
	);
}
