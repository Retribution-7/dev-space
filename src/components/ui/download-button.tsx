"use client";

import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Button } from "@/components/ui/button";

const DOWNLOAD_MIME_TYPE = "application/json";

type DownloadButtonProps = {
	getValue: () => string;
	fileName: string;
	onSuccess?: (fileName: string) => void;
	onError?: (message: string) => void;
	label?: string;
	ariaLabel?: string;
	variant?: React.ComponentProps<typeof Button>["variant"];
	size?: React.ComponentProps<typeof Button>["size"];
	className?: string;
};

export function DownloadButton({
	getValue,
	fileName,
	onSuccess,
	onError,
	label = "Download",
	ariaLabel,
	variant = "outline",
	size = "sm",
	className,
}: DownloadButtonProps) {
	const handleDownload = React.useCallback(() => {
		let objectUrl: string | null = null;
		let anchor: HTMLAnchorElement | null = null;
		let isDownloaded = false;

		try {
			const value = getValue();
			const blob = new Blob([value], { type: DOWNLOAD_MIME_TYPE });

			objectUrl = URL.createObjectURL(blob);
			anchor = document.createElement("a");
			anchor.href = objectUrl;
			anchor.download = fileName;
			anchor.style.display = "none";
			document.body.appendChild(anchor);
			anchor.click();
			isDownloaded = true;
		} catch {
			onError?.(`Could not download "${fileName}". Please try again.`);
		} finally {
			anchor?.remove();

			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
		}

		if (isDownloaded) {
			onSuccess?.(fileName);
		}
	}, [fileName, getValue, onError, onSuccess]);

	const buttonAriaLabel = ariaLabel ?? `Download ${fileName}`;

	return (
		<Button
			type="button"
			variant={variant}
			size={size}
			className={className}
			aria-label={buttonAriaLabel}
			title={buttonAriaLabel}
			onClick={handleDownload}
		>
			<HugeiconsIcon
				icon={Download01Icon}
				className="size-3.5"
				data-icon="inline-start"
				aria-hidden="true"
			/>
			{label}
		</Button>
	);
}
