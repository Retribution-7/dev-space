"use client";

import {
	AlertCircleIcon,
	CheckmarkCircleIcon,
	FileBracesIcon,
	FileDiffIcon,
	GitCompareIcon,
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
import { cn } from "@/shared/lib/utils";

import { compareJson } from "../model/compare-json";
import type {
	CompareDocument,
	CompareDocumentIssue,
	JsonDifference,
} from "../model/types";

import { JsonDiffList } from "./json-diff-list";

type CompareStudioProps = {
	initialOriginal?: string;
	initialModified?: string;
};

type CompareFeedback = {
	status: "success" | "error";
	message: string;
};

const EMPTY_EDITOR_MESSAGE = "The editor is empty. Add some JSON first.";
const EMPTY_DOWNLOAD_MESSAGE = "The editor is empty. Nothing to download.";
const COMPARE_ERROR_MESSAGE =
	"Could not compare the documents. Please try again.";
const UPLOAD_ERROR_MESSAGE =
	"Could not load the file into the editor. Please try again.";

const DOCUMENT_LABELS: Record<CompareDocument, string> = {
	original: "Original JSON",
	modified: "Modified JSON",
};

export function CompareStudio({
	initialOriginal = "",
	initialModified = "",
}: CompareStudioProps) {
	const originalEditorRef = React.useRef<JsonEditorHandle>(null);
	const modifiedEditorRef = React.useRef<JsonEditorHandle>(null);
	const [issues, setIssues] = React.useState<CompareDocumentIssue[]>([]);
	const [differences, setDifferences] = React.useState<JsonDifference[] | null>(
		null,
	);
	const [feedback, setFeedback] = React.useState<CompareFeedback | null>(null);

	const resetComparison = React.useCallback(() => {
		setIssues([]);
		setDifferences(null);
		setFeedback(null);
	}, []);

	const handleOriginalChange = React.useCallback(() => {
		resetComparison();
	}, [resetComparison]);

	const handleModifiedChange = React.useCallback(() => {
		resetComparison();
	}, [resetComparison]);

	const handleOriginalUpload = React.useCallback(
		(content: string, fileName: string) => {
			const editor = originalEditorRef.current;

			resetComparison();

			if (!editor) {
				setFeedback({
					status: "error",
					message: `Original JSON: ${UPLOAD_ERROR_MESSAGE}`,
				});
				return;
			}

			try {
				editor.setValue(content);
			} catch {
				setFeedback({
					status: "error",
					message: `Original JSON: ${UPLOAD_ERROR_MESSAGE}`,
				});
				return;
			}

			setFeedback({
				status: "success",
				message: `Loaded "${fileName}" into Original JSON.`,
			});
		},
		[resetComparison],
	);

	const handleModifiedUpload = React.useCallback(
		(content: string, fileName: string) => {
			const editor = modifiedEditorRef.current;

			resetComparison();

			if (!editor) {
				setFeedback({
					status: "error",
					message: `Modified JSON: ${UPLOAD_ERROR_MESSAGE}`,
				});
				return;
			}

			try {
				editor.setValue(content);
			} catch {
				setFeedback({
					status: "error",
					message: `Modified JSON: ${UPLOAD_ERROR_MESSAGE}`,
				});
				return;
			}

			setFeedback({
				status: "success",
				message: `Loaded "${fileName}" into Modified JSON.`,
			});
		},
		[resetComparison],
	);

	const handleOriginalUploadError = React.useCallback((message: string) => {
		setFeedback({ status: "error", message: `Original JSON: ${message}` });
	}, []);

	const handleModifiedUploadError = React.useCallback((message: string) => {
		setFeedback({ status: "error", message: `Modified JSON: ${message}` });
	}, []);

	const handleDownloadSuccess = React.useCallback((fileName: string) => {
		setFeedback({
			status: "success",
			message: `Downloaded "${fileName}".`,
		});
	}, []);

	const handleDownloadError = React.useCallback((message: string) => {
		setFeedback({ status: "error", message });
	}, []);

	const handleOriginalDownloadEmpty = React.useCallback(() => {
		setFeedback({
			status: "error",
			message: `Original JSON: ${EMPTY_DOWNLOAD_MESSAGE}`,
		});
	}, []);

	const handleModifiedDownloadEmpty = React.useCallback(() => {
		setFeedback({
			status: "error",
			message: `Modified JSON: ${EMPTY_DOWNLOAD_MESSAGE}`,
		});
	}, []);

	const handleCompare = React.useCallback(() => {
		try {
			const originalEditor = originalEditorRef.current;
			const modifiedEditor = modifiedEditorRef.current;

			if (!originalEditor || !modifiedEditor) {
				setIssues([]);
				setDifferences(null);
				setFeedback({ status: "error", message: COMPARE_ERROR_MESSAGE });
				return;
			}

			const result = compareJson(
				originalEditor.getValue(),
				modifiedEditor.getValue(),
			);

			setFeedback(null);

			if (result.status === "error") {
				setIssues(result.issues);
				setDifferences(null);
				return;
			}

			setIssues([]);
			setDifferences(result.differences);
		} catch {
			setIssues([]);
			setDifferences(null);
			setFeedback({ status: "error", message: COMPARE_ERROR_MESSAGE });
		}
	}, []);

	return (
		<div className="flex flex-col gap-6">
			<Card className="gap-0 py-0 shadow-xs">
				<CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b">
					<span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
						<HugeiconsIcon
							icon={FileDiffIcon}
							className="size-4"
							aria-hidden="true"
						/>
					</span>
					<div className="min-w-0 flex-1">
						<CardTitle className="text-sm">JSON Documents</CardTitle>
						<CardDescription className="text-xs">
							Compare an original and a modified JSON document.
						</CardDescription>
					</div>
					<Button
						type="button"
						size="sm"
						className="w-full sm:w-auto"
						onClick={handleCompare}
					>
						<HugeiconsIcon
							icon={GitCompareIcon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Compare
					</Button>
				</CardHeader>
				{feedback ? (
					<div
						role={feedback.status === "error" ? "alert" : "status"}
						className={cn(
							"flex items-start gap-2 border-b px-4 py-2.5 text-sm",
							feedback.status === "error"
								? "border-destructive/20 bg-destructive/5"
								: "border-emerald-500/20 bg-emerald-500/5",
						)}
					>
						<HugeiconsIcon
							icon={
								feedback.status === "error"
									? AlertCircleIcon
									: CheckmarkCircleIcon
							}
							className={cn(
								"mt-0.5 size-4 shrink-0",
								feedback.status === "error"
									? "text-destructive"
									: "text-emerald-600 dark:text-emerald-400",
							)}
							aria-hidden="true"
						/>
						<p className="min-w-0">{feedback.message}</p>
					</div>
				) : null}
				{issues.length > 0 ? (
					<div
						role="alert"
						className="border-destructive/20 bg-destructive/5 flex items-start gap-2 border-b px-4 py-2.5 text-sm"
					>
						<HugeiconsIcon
							icon={AlertCircleIcon}
							className="text-destructive mt-0.5 size-4 shrink-0"
							aria-hidden="true"
						/>
						<div className="flex min-w-0 flex-col gap-1">
							{issues.map((issue) => (
								<p
									key={`${issue.document}-${issue.reason}`}
									className="min-w-0"
								>
									{formatIssue(issue)}
								</p>
							))}
						</div>
					</div>
				) : null}
				<CardContent className="p-0">
					<div className="grid grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
						<EditorPanel
							headingId="original-json-heading"
							title="Original JSON"
							description="Source document"
							ariaLabel="Original JSON editor"
							editorRef={originalEditorRef}
							getValue={() => originalEditorRef.current?.getValue() ?? ""}
							downloadFileName="original.json"
							onUpload={handleOriginalUpload}
							onUploadError={handleOriginalUploadError}
							onDownloadSuccess={handleDownloadSuccess}
							onDownloadError={handleDownloadError}
							onDownloadEmpty={handleOriginalDownloadEmpty}
							initialValue={initialOriginal}
							onChange={handleOriginalChange}
						/>
						<EditorPanel
							headingId="modified-json-heading"
							title="Modified JSON"
							description="Changed document"
							ariaLabel="Modified JSON editor"
							editorRef={modifiedEditorRef}
							getValue={() => modifiedEditorRef.current?.getValue() ?? ""}
							downloadFileName="modified.json"
							onUpload={handleModifiedUpload}
							onUploadError={handleModifiedUploadError}
							onDownloadSuccess={handleDownloadSuccess}
							onDownloadError={handleDownloadError}
							onDownloadEmpty={handleModifiedDownloadEmpty}
							initialValue={initialModified}
							onChange={handleModifiedChange}
						/>
					</div>
				</CardContent>
			</Card>
			<div aria-live="polite">
				{differences !== null ? (
					<JsonDiffList differences={differences} />
				) : null}
			</div>
		</div>
	);
}

function EditorPanel({
	headingId,
	title,
	description,
	ariaLabel,
	editorRef,
	getValue,
	downloadFileName,
	onUpload,
	onUploadError,
	onDownloadSuccess,
	onDownloadError,
	onDownloadEmpty,
	initialValue,
	onChange,
}: {
	headingId: string;
	title: string;
	description: string;
	ariaLabel: string;
	editorRef: React.Ref<JsonEditorHandle>;
	getValue: () => string;
	downloadFileName: string;
	onUpload: (content: string, fileName: string) => void;
	onUploadError: (message: string) => void;
	onDownloadSuccess: (fileName: string) => void;
	onDownloadError: (message: string) => void;
	onDownloadEmpty: () => void;
	initialValue: string;
	onChange: () => void;
}) {
	return (
		<section aria-labelledby={headingId} className="flex min-w-0 flex-col">
			<div className="bg-muted/30 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
				<div className="flex min-w-0 items-center gap-2">
					<span className="bg-secondary text-secondary-foreground grid size-6 shrink-0 place-items-center rounded-md">
						<HugeiconsIcon
							icon={FileBracesIcon}
							className="size-3.5"
							aria-hidden="true"
						/>
					</span>
					<h3 id={headingId} className="truncate text-sm font-medium">
						{title}
					</h3>
				</div>
				<div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
					<span className="text-muted-foreground hidden text-[0.7rem] sm:inline">
						{description}
					</span>
					<FileUploadButton
						onFileLoad={onUpload}
						onError={onUploadError}
						ariaLabel={`Upload ${title} from a JSON file`}
						variant="outline"
						size="xs"
					/>
					<DownloadButton
						getValue={getValue}
						fileName={downloadFileName}
						onSuccess={onDownloadSuccess}
						onError={onDownloadError}
						onEmpty={onDownloadEmpty}
						ariaLabel={`Download ${title} as ${downloadFileName}`}
						variant="outline"
						size="xs"
					/>
					<CopyButton
						getValue={getValue}
						ariaLabel={`Copy ${title} contents`}
						variant="outline"
						size="xs"
					/>
				</div>
			</div>
			<div className="h-[clamp(18rem,45svh,28rem)] lg:h-[clamp(20rem,52svh,34rem)]">
				<JsonEditor
					ref={editorRef}
					ariaLabel={ariaLabel}
					initialValue={initialValue}
					onChange={onChange}
				/>
			</div>
		</section>
	);
}

function formatIssue(issue: CompareDocumentIssue): string {
	const label = DOCUMENT_LABELS[issue.document];

	if (issue.reason === "empty") {
		return `${label}: ${EMPTY_EDITOR_MESSAGE}`;
	}

	return `${label}: Invalid JSON: ${issue.message}`;
}
