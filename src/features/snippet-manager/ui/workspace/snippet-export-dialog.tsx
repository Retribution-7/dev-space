"use client";

import {
	Download01Icon,
	FileBracesIcon,
	FileCodeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/shared/lib/utils";

import {
	buildCodeExportArchive,
	buildCodeExportArchiveName,
	buildCodeExportFiles,
	buildSnippetsExportDocument,
	buildSnippetsExportFileName,
	serializeSnippetsExportDocument,
} from "../../model/snippet-export";
import type { Snippet } from "../../model/types";
import type { WorkspaceFeedback } from "../feedback-banner";

import { downloadFile } from "./download-file";

type ExportFormat = "metadata" | "code";

const EXPORT_FORMAT_OPTIONS: {
	value: ExportFormat;
	title: string;
	description: string;
}[] = [
	{
		value: "metadata",
		title: "With Metadata (JSON)",
		description:
			"All snippets with titles, descriptions, languages, categories, tags, and dates in a single JSON document.",
	},
	{
		value: "code",
		title: "Code Only (Source Files)",
		description:
			"Only the source code: one file per snippet, or a ZIP archive for several snippets.",
	},
];

type SnippetExportDialogProps = {
	open: boolean;
	snippets: Snippet[];
	onOpenChange: (open: boolean) => void;
	onFeedback: (feedback: WorkspaceFeedback) => void;
};

export function SnippetExportDialog({
	open,
	snippets,
	onOpenChange,
	onFeedback,
}: SnippetExportDialogProps) {
	const [format, setFormat] = React.useState<ExportFormat>("metadata");
	const isEmpty = snippets.length === 0;

	function handleExport() {
		try {
			if (format === "metadata") {
				const document = buildSnippetsExportDocument(snippets);
				const fileName = buildSnippetsExportFileName();

				downloadFile(
					serializeSnippetsExportDocument(document),
					fileName,
					"application/json",
				);
				onFeedback({
					status: "success",
					message: `Exported ${snippets.length} snippets to ${fileName}.`,
				});
			} else {
				const files = buildCodeExportFiles(snippets);

				if (files.length === 1) {
					downloadFile(files[0].code, files[0].fileName, "text/plain");
					onFeedback({
						status: "success",
						message: `Exported "${files[0].fileName}".`,
					});
				} else {
					const fileName = buildCodeExportArchiveName();

					downloadFile(
						buildCodeExportArchive(files),
						fileName,
						"application/zip",
					);
					onFeedback({
						status: "success",
						message: `Exported ${files.length} source files to ${fileName}.`,
					});
				}
			}

			onOpenChange(false);
		} catch {
			onFeedback({
				status: "error",
				message: "Could not export the snippets. Please try again.",
			});
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Export snippets</DialogTitle>
					<DialogDescription>
						All saved snippets are exported regardless of the current search,
						filters, and sorting.
					</DialogDescription>
				</DialogHeader>

				<RadioGroup
					value={format}
					onValueChange={(value) => setFormat(value as ExportFormat)}
					className="gap-2"
				>
					{EXPORT_FORMAT_OPTIONS.map((option) => (
						<label
							key={option.value}
							className={cn(
								"hover:bg-muted/50 flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
								format === option.value && "border-primary/40 bg-primary/5",
							)}
						>
							<RadioGroupItem value={option.value} className="mt-0.5" />
							<span className="min-w-0">
								<span className="flex items-center gap-1.5 text-sm font-medium">
									<HugeiconsIcon
										icon={
											option.value === "metadata"
												? FileBracesIcon
												: FileCodeIcon
										}
										className="size-4"
										aria-hidden="true"
									/>
									{option.title}
								</span>
								<span className="text-muted-foreground mt-1 block text-xs leading-5">
									{option.description}
								</span>
							</span>
						</label>
					))}
				</RadioGroup>

				<p className="text-muted-foreground text-xs">
					{isEmpty
						? "There are no saved snippets to export yet."
						: `${snippets.length} saved ${snippets.length === 1 ? "snippet" : "snippets"} will be exported.`}
				</p>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button type="button" onClick={handleExport} disabled={isEmpty}>
						<HugeiconsIcon
							icon={Download01Icon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Export
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
