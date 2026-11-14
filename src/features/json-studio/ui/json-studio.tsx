"use client";

import {
	AlertCircleIcon,
	CheckmarkCircleIcon,
	FileBracesIcon,
	TextIndent01Icon,
	TextIndentLessIcon,
	ValidationIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { JsonEditor, type JsonEditorHandle } from "@/components/ui/json-editor";

import { formatJson } from "../model/format-json";
import { minifyJson } from "../model/minify-json";
import type { JsonTransformResult } from "../model/transform-json";
import { validateJson } from "../model/validate-json";

type JsonStudioProps = {
	initialValue: string;
};

type JsonTransform = (input: string) => JsonTransformResult;

type JsonCheckFailure =
	{ status: "empty" } | { status: "invalid"; message: string };

const EMPTY_EDITOR_MESSAGE = "The editor is empty. Add some JSON first.";
const VALIDATE_SUCCESS_MESSAGE = "JSON is valid.";

export function JsonStudio({ initialValue }: JsonStudioProps) {
	const editorRef = React.useRef<JsonEditorHandle>(null);
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [successMessage, setSuccessMessage] = React.useState<string | null>(
		null,
	);

	const applyFailure = React.useCallback((result: JsonCheckFailure) => {
		if (result.status === "empty") {
			setErrorMessage(EMPTY_EDITOR_MESSAGE);
		} else {
			setErrorMessage(`Invalid JSON: ${result.message}`);
		}

		setSuccessMessage(null);
	}, []);

	const applyTransform = React.useCallback(
		(transform: JsonTransform) => {
			const editor = editorRef.current;

			if (!editor) {
				return;
			}

			const result = transform(editor.getValue());

			if (result.status !== "success") {
				applyFailure(result);
				return;
			}

			setErrorMessage(null);
			setSuccessMessage(null);
			editor.setValue(result.value);
		},
		[applyFailure],
	);

	const handleFormat = React.useCallback(() => {
		applyTransform(formatJson);
	}, [applyTransform]);

	const handleMinify = React.useCallback(() => {
		applyTransform(minifyJson);
	}, [applyTransform]);

	const handleValidate = React.useCallback(() => {
		const editor = editorRef.current;

		if (!editor) {
			return;
		}

		const result = validateJson(editor.getValue());

		if (result.status !== "valid") {
			applyFailure(result);
			return;
		}

		setErrorMessage(null);
		setSuccessMessage(VALIDATE_SUCCESS_MESSAGE);
	}, [applyFailure]);

	const handleEditorChange = React.useCallback(() => {
		setErrorMessage(null);
		setSuccessMessage(null);
	}, []);

	return (
		<Card className="gap-0 py-0 shadow-xs">
			<CardHeader className="flex flex-row items-center gap-3 border-b">
				<span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
					<HugeiconsIcon
						icon={FileBracesIcon}
						className="size-4"
						aria-hidden="true"
					/>
				</span>
				<div className="min-w-0 flex-1">
					<CardTitle className="text-sm">JSON Editor</CardTitle>
					<CardDescription className="text-xs">
						Syntax highlighting, line numbers, and word wrap are enabled.
					</CardDescription>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<span className="bg-muted text-muted-foreground hidden rounded-md border px-2 py-1 font-mono text-[0.7rem] sm:inline-flex">
						JSON
					</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleFormat}
					>
						<HugeiconsIcon
							icon={TextIndent01Icon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Format
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleMinify}
					>
						<HugeiconsIcon
							icon={TextIndentLessIcon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Minify
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleValidate}
					>
						<HugeiconsIcon
							icon={ValidationIcon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Validate
					</Button>
				</div>
			</CardHeader>
			{errorMessage ? (
				<div
					role="alert"
					className="border-destructive/20 bg-destructive/5 flex items-start gap-2 border-b px-4 py-2.5 text-sm"
				>
					<HugeiconsIcon
						icon={AlertCircleIcon}
						className="text-destructive mt-0.5 size-4 shrink-0"
						aria-hidden="true"
					/>
					<p className="min-w-0">{errorMessage}</p>
				</div>
			) : null}
			{successMessage ? (
				<div
					role="status"
					className="flex items-start gap-2 border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-sm"
				>
					<HugeiconsIcon
						icon={CheckmarkCircleIcon}
						className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
						aria-hidden="true"
					/>
					<p className="min-w-0">{successMessage}</p>
				</div>
			) : null}
			<CardContent className="p-0">
				<JsonEditor
					ref={editorRef}
					ariaLabel="JSON document editor"
					className="h-[clamp(20rem,calc(100svh-16rem),44rem)]"
					initialValue={initialValue}
					onChange={handleEditorChange}
				/>
			</CardContent>
		</Card>
	);
}
