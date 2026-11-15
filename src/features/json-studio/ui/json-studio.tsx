"use client";

import {
	AlertCircleIcon,
	CheckmarkCircleIcon,
	CodeIcon,
	FileBracesIcon,
	HierarchyIcon,
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
import { CopyButton } from "@/components/ui/copy-button";
import { DownloadButton } from "@/components/ui/download-button";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { JsonEditor, type JsonEditorHandle } from "@/components/ui/json-editor";

import { formatJson } from "../model/format-json";
import { minifyJson } from "../model/minify-json";
import { type JsonParseResult, parseJson } from "../model/parse-json";
import type { JsonTransformResult } from "../model/transform-json";
import { validateJson, type ValidateJsonResult } from "../model/validate-json";

import { JsonTreeView } from "./json-tree-view";

type JsonStudioProps = {
	initialValue: string;
};

type JsonTransform = (input: string) => JsonTransformResult;

type JsonCheckFailure =
	{ status: "empty" } | { status: "invalid"; message: string };

type ViewMode = "code" | "tree";

const EMPTY_EDITOR_MESSAGE = "The editor is empty. Add some JSON first.";
const EMPTY_DOWNLOAD_MESSAGE = "The editor is empty. Nothing to download.";
const EDITOR_UNAVAILABLE_MESSAGE = "The editor is not ready. Please try again.";
const TRANSFORM_ERROR_MESSAGE = "Could not process the JSON. Please try again.";
const VALIDATE_ERROR_MESSAGE = "Could not validate the JSON. Please try again.";
const UPLOAD_ERROR_MESSAGE =
	"Could not load the file into the editor. Please try again.";
const VALIDATE_SUCCESS_MESSAGE = "JSON is valid.";

export function JsonStudio({ initialValue }: JsonStudioProps) {
	const editorRef = React.useRef<JsonEditorHandle>(null);
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [successMessage, setSuccessMessage] = React.useState<string | null>(
		null,
	);
	const [viewMode, setViewMode] = React.useState<ViewMode>("code");
	const [treeSnapshot, setTreeSnapshot] =
		React.useState<JsonParseResult | null>(null);

	const showError = React.useCallback((message: string) => {
		setErrorMessage(message);
		setSuccessMessage(null);
	}, []);

	const showSuccess = React.useCallback((message: string) => {
		setSuccessMessage(message);
		setErrorMessage(null);
	}, []);

	const clearFeedback = React.useCallback(() => {
		setErrorMessage(null);
		setSuccessMessage(null);
	}, []);

	const applyFailure = React.useCallback(
		(result: JsonCheckFailure) => {
			showError(
				result.status === "empty"
					? EMPTY_EDITOR_MESSAGE
					: `Invalid JSON: ${result.message}`,
			);
		},
		[showError],
	);

	const applyTransform = React.useCallback(
		(transform: JsonTransform) => {
			const editor = editorRef.current;

			if (!editor) {
				showError(EDITOR_UNAVAILABLE_MESSAGE);
				return;
			}

			let result: JsonTransformResult;

			try {
				result = transform(editor.getValue());
			} catch {
				showError(TRANSFORM_ERROR_MESSAGE);
				return;
			}

			if (result.status !== "success") {
				applyFailure(result);
				return;
			}

			try {
				editor.setValue(result.value);
			} catch {
				showError(TRANSFORM_ERROR_MESSAGE);
				return;
			}

			clearFeedback();
		},
		[applyFailure, clearFeedback, showError],
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
			showError(EDITOR_UNAVAILABLE_MESSAGE);
			return;
		}

		let result: ValidateJsonResult;

		try {
			result = validateJson(editor.getValue());
		} catch {
			showError(VALIDATE_ERROR_MESSAGE);
			return;
		}

		if (result.status !== "valid") {
			applyFailure(result);
			return;
		}

		showSuccess(VALIDATE_SUCCESS_MESSAGE);
	}, [applyFailure, showError, showSuccess]);

	const handleViewModeChange = React.useCallback(
		(mode: ViewMode) => {
			setViewMode(mode);
			clearFeedback();

			if (mode === "tree") {
				setTreeSnapshot(parseJson(editorRef.current?.getValue() ?? ""));
			}
		},
		[clearFeedback],
	);

	const handleEditorChange = React.useCallback(() => {
		clearFeedback();

		if (viewMode === "tree") {
			setTreeSnapshot(parseJson(editorRef.current?.getValue() ?? ""));
		}
	}, [clearFeedback, viewMode]);

	const handleUpload = React.useCallback(
		(content: string, fileName: string) => {
			const editor = editorRef.current;

			if (!editor) {
				showError(UPLOAD_ERROR_MESSAGE);
				return;
			}

			try {
				editor.setValue(content);

				if (viewMode === "tree") {
					setTreeSnapshot(parseJson(content));
				}
			} catch {
				showError(UPLOAD_ERROR_MESSAGE);
				return;
			}

			showSuccess(`Loaded "${fileName}".`);
		},
		[showError, showSuccess, viewMode],
	);

	const handleDownloadSuccess = React.useCallback(
		(fileName: string) => {
			showSuccess(`Downloaded "${fileName}".`);
		},
		[showSuccess],
	);

	const handleDownloadEmpty = React.useCallback(() => {
		showError(EMPTY_DOWNLOAD_MESSAGE);
	}, [showError]);

	return (
		<Card className="gap-0 py-0 shadow-xs">
			<CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b">
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
				<div className="flex flex-wrap items-center justify-end gap-2">
					<span className="bg-muted text-muted-foreground hidden rounded-md border px-2 py-1 font-mono text-[0.7rem] sm:inline-flex">
						JSON
					</span>
					<FileUploadButton
						onFileLoad={handleUpload}
						onError={showError}
						ariaLabel="Upload a JSON file into the editor"
					/>
					<DownloadButton
						getValue={() => editorRef.current?.getValue() ?? ""}
						fileName="data.json"
						onSuccess={handleDownloadSuccess}
						onError={showError}
						onEmpty={handleDownloadEmpty}
						ariaLabel="Download JSON editor contents as data.json"
					/>
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
					<CopyButton
						getValue={() => editorRef.current?.getValue() ?? ""}
						ariaLabel="Copy JSON editor contents"
						variant="outline"
						size="sm"
					/>
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
			<div className="flex items-center gap-2 border-b px-4 py-2">
				<div
					role="group"
					aria-label="View mode"
					className="bg-muted text-muted-foreground inline-flex items-center rounded-lg p-1"
				>
					<Button
						type="button"
						variant={viewMode === "code" ? "outline" : "ghost"}
						size="sm"
						aria-pressed={viewMode === "code"}
						onClick={() => handleViewModeChange("code")}
					>
						<HugeiconsIcon
							icon={CodeIcon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Code
					</Button>
					<Button
						type="button"
						variant={viewMode === "tree" ? "outline" : "ghost"}
						size="sm"
						aria-pressed={viewMode === "tree"}
						onClick={() => handleViewModeChange("tree")}
					>
						<HugeiconsIcon
							icon={HierarchyIcon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Tree
					</Button>
				</div>
			</div>
			<CardContent className="p-0">
				<div className="h-[clamp(20rem,calc(100svh-16rem),44rem)]">
					<JsonEditor
						ref={editorRef}
						ariaLabel="JSON document editor"
						className={viewMode === "tree" ? "hidden" : undefined}
						initialValue={initialValue}
						onChange={handleEditorChange}
					/>
					{viewMode === "tree" && treeSnapshot?.status === "success" ? (
						<JsonTreeView value={treeSnapshot.value} />
					) : null}
					{viewMode === "tree" &&
					treeSnapshot &&
					treeSnapshot.status !== "success" ? (
						<div
							role="alert"
							className="border-destructive/20 bg-destructive/5 flex items-start gap-2 border-b px-4 py-2.5 text-sm"
						>
							<HugeiconsIcon
								icon={AlertCircleIcon}
								className="text-destructive mt-0.5 size-4 shrink-0"
								aria-hidden="true"
							/>
							<p className="min-w-0">
								{treeSnapshot.status === "invalid"
									? `Invalid JSON: ${treeSnapshot.message}`
									: EMPTY_EDITOR_MESSAGE}
							</p>
						</div>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
