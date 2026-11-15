"use client";

import {
	AlertCircleIcon,
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
import { JsonEditor, type JsonEditorHandle } from "@/components/ui/json-editor";

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

const EMPTY_EDITOR_MESSAGE = "The editor is empty. Add some JSON first.";

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

	const resetComparison = React.useCallback(() => {
		setIssues([]);
		setDifferences(null);
	}, []);

	const handleOriginalChange = React.useCallback(() => {
		resetComparison();
	}, [resetComparison]);

	const handleModifiedChange = React.useCallback(() => {
		resetComparison();
	}, [resetComparison]);

	const handleCompare = React.useCallback(() => {
		const originalValue =
			originalEditorRef.current?.getValue() ?? initialOriginal;
		const modifiedValue =
			modifiedEditorRef.current?.getValue() ?? initialModified;
		const result = compareJson(originalValue, modifiedValue);

		if (result.status === "error") {
			setIssues(result.issues);
			setDifferences(null);
			return;
		}

		setIssues([]);
		setDifferences(result.differences);
	}, [initialModified, initialOriginal]);

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
							getCopyValue={() => originalEditorRef.current?.getValue() ?? ""}
							initialValue={initialOriginal}
							onChange={handleOriginalChange}
						/>
						<EditorPanel
							headingId="modified-json-heading"
							title="Modified JSON"
							description="Changed document"
							ariaLabel="Modified JSON editor"
							editorRef={modifiedEditorRef}
							getCopyValue={() => modifiedEditorRef.current?.getValue() ?? ""}
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
	getCopyValue,
	initialValue,
	onChange,
}: {
	headingId: string;
	title: string;
	description: string;
	ariaLabel: string;
	editorRef: React.Ref<JsonEditorHandle>;
	getCopyValue: () => string;
	initialValue: string;
	onChange: () => void;
}) {
	return (
		<section aria-labelledby={headingId} className="flex min-w-0 flex-col">
			<div className="bg-muted/30 flex items-center justify-between gap-2 border-b px-4 py-2">
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
				<div className="flex shrink-0 items-center gap-2">
					<span className="text-muted-foreground hidden text-[0.7rem] sm:inline">
						{description}
					</span>
					<CopyButton
						getValue={getCopyValue}
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
