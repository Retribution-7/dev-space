"use client";

import { CheckmarkCircleIcon, Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";

import {
	buildSnippetFromSourceFile,
	createSourceFileCandidate,
	extractSourceFilesFromArchive,
	findSnippetsIdConflicts,
	type ImportConflictStrategy,
	parseSnippetsImportDocument,
	resolveImportConflicts,
	type SnippetsImportEntryError,
	type SourceFileCandidate,
} from "../../model/snippet-import";
import {
	SNIPPET_LANGUAGES,
	type SnippetLanguage,
} from "../../model/snippet-languages";
import type { Snippet } from "../../model/types";

type ImportFormat = "metadata" | "code";

type SourceFileRow = {
	key: string;
	candidate: SourceFileCandidate;
	manualLanguage: string | null;
};

type SnippetImportDialogProps = {
	open: boolean;
	existingSnippets: Snippet[];
	onOpenChange: (open: boolean) => void;
	onImport: (records: Snippet[], message: string) => void;
};

function formatBytes(size: number): string {
	if (size < 1024) {
		return `${size} B`;
	}

	if (size < 1024 * 1024) {
		return `${Math.round(size / 1024)} KB`;
	}

	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function SnippetImportDialog({
	open,
	existingSnippets,
	onOpenChange,
	onImport,
}: SnippetImportDialogProps) {
	const [format, setFormat] = React.useState<ImportFormat>("metadata");
	const [documentError, setDocumentError] = React.useState<string | null>(null);
	const [entryErrors, setEntryErrors] = React.useState<
		SnippetsImportEntryError[]
	>([]);
	const [importPreview, setImportPreview] = React.useState<Snippet[]>([]);
	const [conflictIds, setConflictIds] = React.useState<string[]>([]);
	const [conflictStrategy, setConflictStrategy] =
		React.useState<ImportConflictStrategy>("skip");
	const [sourceRows, setSourceRows] = React.useState<SourceFileRow[]>([]);
	const [skippedFiles, setSkippedFiles] = React.useState<
		{ name: string; message: string }[]
	>([]);
	const sourceInputRef = React.useRef<HTMLInputElement>(null);

	const readySourceRows = sourceRows.filter(
		(row) =>
			row.candidate.error === null &&
			(row.candidate.language !== null || row.manualLanguage !== null),
	);
	const canImport =
		format === "metadata"
			? importPreview.length > 0
			: readySourceRows.length > 0;

	function resetSourceSelection() {
		setSourceRows([]);
		setSkippedFiles([]);
	}

	function handleFormatChange(nextFormat: ImportFormat) {
		setFormat(nextFormat);
		setDocumentError(null);
		setEntryErrors([]);
		setImportPreview([]);
		setConflictIds([]);
		resetSourceSelection();
	}

	function handleMetadataLoad(content: string) {
		const result = parseSnippetsImportDocument(content);

		setConflictIds([]);

		if (!result.ok) {
			setDocumentError(result.error);
			setEntryErrors([]);
			setImportPreview([]);
			return;
		}

		setDocumentError(null);
		setEntryErrors(result.result.errors);
		setImportPreview(result.result.snippets);
		setConflictIds(
			findSnippetsIdConflicts(result.result.snippets, existingSnippets),
		);
	}

	async function readSourceFiles(files: File[]) {
		const nextRows: SourceFileRow[] = [];
		const nextSkipped: { name: string; message: string }[] = [];
		let error: string | null = null;

		for (const file of files) {
			try {
				if (file.name.toLowerCase().endsWith(".zip")) {
					const extracted = extractSourceFilesFromArchive(
						new Uint8Array(await file.arrayBuffer()),
					);

					if (!extracted.ok) {
						error = extracted.error;
						continue;
					}

					nextSkipped.push(...extracted.skipped);
					nextRows.push(
						...extracted.candidates.map((candidate, index) => ({
							key: `${file.name}-${index}-${candidate.name}`,
							candidate,
							manualLanguage: null,
						})),
					);
				} else {
					nextRows.push({
						key: `${file.name}-${nextRows.length}`,
						candidate: createSourceFileCandidate(
							file.name,
							await file.text(),
							file.size,
						),
						manualLanguage: null,
					});
				}
			} catch {
				error = `Could not read "${file.name}". Please try again.`;
			}
		}

		setDocumentError(error);
		setSkippedFiles((current) => [...current, ...nextSkipped]);
		setSourceRows((current) => [...current, ...nextRows]);
	}

	function handleSourceInputChange(event: React.ChangeEvent<HTMLInputElement>) {
		const input = event.currentTarget;
		const files = Array.from(input.files ?? []);

		input.value = "";

		if (files.length === 0) {
			return;
		}

		void readSourceFiles(files);
	}

	function handleImport() {
		if (format === "metadata") {
			const records = resolveImportConflicts(
				importPreview,
				existingSnippets,
				conflictStrategy,
			);
			const skippedCount = importPreview.length - records.length;
			const messageParts = [
				`Imported ${records.length} ${records.length === 1 ? "snippet" : "snippets"}.`,
			];

			if (skippedCount > 0) {
				messageParts.push(`${skippedCount} duplicates were skipped.`);
			}

			if (entryErrors.length > 0) {
				messageParts.push(
					`${entryErrors.length} invalid entries were skipped.`,
				);
			}

			onImport(records, messageParts.join(" "));
			return;
		}

		const records: Snippet[] = [];
		const errors: string[] = [];

		for (const row of sourceRows) {
			const result = buildSnippetFromSourceFile(
				row.candidate,
				row.manualLanguage,
			);

			if ("error" in result) {
				errors.push(`${row.candidate.name}: ${result.error}`);
			} else {
				records.push(result.snippet);
			}
		}

		if (records.length === 0) {
			setDocumentError(
				errors[0] ?? "There are no source files ready for import.",
			);
			return;
		}

		const messageParts = [
			`Imported ${records.length} ${records.length === 1 ? "snippet" : "snippets"}.`,
		];

		if (errors.length > 0) {
			messageParts.push(`${errors.length} files were skipped.`);
		}

		onImport(records, messageParts.join(" "));
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Import snippets</DialogTitle>
					<DialogDescription>
						Nothing is saved until you confirm the import.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4">
					<RadioGroup
						value={format}
						onValueChange={(value) => handleFormatChange(value as ImportFormat)}
						className="gap-2"
					>
						<label className="hover:bg-muted/50 has-data-[slot=radio-group-item][data-checked]:border-primary/40 flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors">
							<RadioGroupItem value="metadata" className="mt-0.5" />
							<span className="min-w-0">
								<span className="text-sm font-medium">
									With Metadata (JSON)
								</span>
								<span className="text-muted-foreground mt-1 block text-xs leading-5">
									A JSON document exported by DevSpace.
								</span>
							</span>
						</label>
						<label className="hover:bg-muted/50 flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors">
							<RadioGroupItem value="code" className="mt-0.5" />
							<span className="min-w-0">
								<span className="text-sm font-medium">
									Code Only (Source Files)
								</span>
								<span className="text-muted-foreground mt-1 block text-xs leading-5">
									Source files or a ZIP archive; every snippet gets a fresh id
									and the current dates.
								</span>
							</span>
						</label>
					</RadioGroup>

					{format === "metadata" ? (
						<div className="grid gap-3">
							<div className="flex flex-wrap items-center gap-2">
								<FileUploadButton
									label="Choose JSON file"
									ariaLabel="Choose a DevSpace snippets JSON file"
									onFileLoad={handleMetadataLoad}
									onError={setDocumentError}
								/>
								{importPreview.length > 0 || entryErrors.length > 0 ? (
									<span className="text-muted-foreground text-xs">
										{importPreview.length} ready · {entryErrors.length} invalid
										· {conflictIds.length} conflicts
									</span>
								) : null}
							</div>

							{documentError ? (
								<p role="alert" className="text-destructive text-xs">
									{documentError}
								</p>
							) : null}

							{entryErrors.length > 0 ? (
								<ul className="bg-destructive/5 text-destructive border-destructive/20 max-h-32 overflow-y-auto rounded-lg border p-2 text-xs">
									{entryErrors.map((error) => (
										<li key={error.index}>
											Entry #{error.index}: {error.message}
										</li>
									))}
								</ul>
							) : null}

							{conflictIds.length > 0 ? (
								<div className="rounded-lg border p-3">
									<p className="text-sm font-medium">
										{conflictIds.length}{" "}
										{conflictIds.length === 1 ? "snippet" : "snippets"} already
										exist in your collection
									</p>
									<RadioGroup
										value={conflictStrategy}
										onValueChange={(value) =>
											setConflictStrategy(value as ImportConflictStrategy)
										}
										className="mt-2 gap-1.5"
									>
										<label className="flex cursor-pointer items-start gap-2 text-sm">
											<RadioGroupItem value="skip" className="mt-0.5" />
											<span>
												Skip duplicates
												<span className="text-muted-foreground block text-xs">
													Only new snippets are imported.
												</span>
											</span>
										</label>
										<label className="flex cursor-pointer items-start gap-2 text-sm">
											<RadioGroupItem value="copies" className="mt-0.5" />
											<span>
												Import as copies
												<span className="text-muted-foreground block text-xs">
													Conflicting snippets get new ids; existing ones are
													not changed.
												</span>
											</span>
										</label>
									</RadioGroup>
								</div>
							) : null}
						</div>
					) : (
						<div className="grid gap-3">
							<div className="flex flex-wrap items-center gap-2">
								<input
									ref={sourceInputRef}
									type="file"
									multiple
									className="sr-only"
									tabIndex={-1}
									aria-hidden="true"
									onChange={handleSourceInputChange}
								/>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => sourceInputRef.current?.click()}
								>
									<HugeiconsIcon
										icon={Upload01Icon}
										className="size-3.5"
										data-icon="inline-start"
										aria-hidden="true"
									/>
									Choose files
								</Button>
								{sourceRows.length > 0 ? (
									<Button
										type="button"
										variant="ghost"
										size="xs"
										onClick={resetSourceSelection}
									>
										Clear selection
									</Button>
								) : null}
								<span className="text-muted-foreground text-xs">
									Source files and ZIP archives are supported.
								</span>
							</div>

							{documentError ? (
								<p role="alert" className="text-destructive text-xs">
									{documentError}
								</p>
							) : null}

							{skippedFiles.length > 0 ? (
								<ul className="text-muted-foreground max-h-20 overflow-y-auto rounded-lg border p-2 text-xs">
									{skippedFiles.map((skipped) => (
										<li key={skipped.name}>
											<span className="truncate">{skipped.name}</span>:{" "}
											{skipped.message}
										</li>
									))}
								</ul>
							) : null}

							{sourceRows.length > 0 ? (
								<ul className="max-h-56 overflow-y-auto rounded-lg border">
									{sourceRows.map((row) => {
										const needsLanguage =
											row.candidate.error === null &&
											row.candidate.language === null &&
											row.manualLanguage === null;

										return (
											<li
												key={row.key}
												className="flex items-start gap-2 border-b px-3 py-2 last:border-b-0"
											>
												<div className="min-w-0 flex-1">
													<p className="truncate text-xs font-medium">
														{row.candidate.name}
													</p>
													<p className="text-muted-foreground mt-0.5 text-xs">
														{formatBytes(row.candidate.size)} ·{" "}
														{row.candidate.language ??
															row.manualLanguage ??
															"Language required"}
													</p>
													{row.candidate.error ? (
														<p
															role="alert"
															className="text-destructive mt-0.5 text-xs"
														>
															{row.candidate.error}
														</p>
													) : null}
												</div>

												{needsLanguage ? (
													<Select
														value={row.manualLanguage ?? ""}
														onValueChange={(value) =>
															setSourceRows((current) =>
																current.map((item) =>
																	item.key === row.key
																		? {
																				...item,
																				manualLanguage: (value ||
																					null) as SnippetLanguage | null,
																			}
																		: item,
																),
															)
														}
													>
														<SelectTrigger
															type="button"
															size="sm"
															className="w-36 text-xs"
															aria-label={`Choose language for ${row.candidate.name}`}
														>
															<span>Choose language</span>
														</SelectTrigger>
														<SelectContent>
															{SNIPPET_LANGUAGES.map((language) => (
																<SelectItem key={language} value={language}>
																	{language}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												) : (
													<Badge
														variant={
															row.candidate.error ? "destructive" : "secondary"
														}
													>
														{row.candidate.error ? "Invalid" : "Ready"}
													</Badge>
												)}
											</li>
										);
									})}
								</ul>
							) : null}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button type="button" onClick={handleImport} disabled={!canImport}>
						<HugeiconsIcon
							icon={CheckmarkCircleIcon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Import
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
