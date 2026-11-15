"use client";

import { Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Button } from "@/components/ui/button";

const INVALID_FILE_MESSAGE = "Only .json files are supported.";

type FileUploadButtonProps = {
	onFileLoad: (content: string, fileName: string) => void;
	onError?: (message: string) => void;
	label?: string;
	ariaLabel?: string;
	variant?: React.ComponentProps<typeof Button>["variant"];
	size?: React.ComponentProps<typeof Button>["size"];
	className?: string;
};

export function FileUploadButton({
	onFileLoad,
	onError,
	label = "Upload",
	ariaLabel = "Upload a JSON file",
	variant = "outline",
	size = "sm",
	className,
}: FileUploadButtonProps) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const operationIdRef = React.useRef(0);

	const handleButtonClick = React.useCallback(() => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		input.value = "";
		input.click();
	}, []);

	const handleFileChange = React.useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const input = event.currentTarget;
			const file = input.files?.[0] ?? null;
			const operationId = operationIdRef.current + 1;

			operationIdRef.current = operationId;
			input.value = "";

			if (!file) {
				return;
			}

			if (!file.name.toLowerCase().endsWith(".json")) {
				onError?.(INVALID_FILE_MESSAGE);
				return;
			}

			try {
				const content = await file.text();

				if (operationId !== operationIdRef.current) {
					return;
				}

				onFileLoad(content, file.name);
			} catch {
				if (operationId !== operationIdRef.current) {
					return;
				}

				onError?.(`Could not read "${file.name}". Please try again.`);
			}
		},
		[onError, onFileLoad],
	);

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				accept=".json,application/json"
				className="sr-only"
				tabIndex={-1}
				aria-hidden="true"
				onChange={(event) => void handleFileChange(event)}
			/>
			<Button
				type="button"
				variant={variant}
				size={size}
				className={className}
				aria-label={ariaLabel}
				title={ariaLabel}
				onClick={handleButtonClick}
			>
				<HugeiconsIcon
					icon={Upload01Icon}
					className="size-3.5"
					data-icon="inline-start"
					aria-hidden="true"
				/>
				{label}
			</Button>
		</>
	);
}
