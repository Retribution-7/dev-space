"use client";

import { AlertCircleIcon } from "@hugeicons/core-free-icons";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
	DEFAULT_SNIPPET_LANGUAGE,
	parseTagsInput,
} from "../../model/snippet-draft";
import { getLanguageOptions } from "../../model/snippet-languages";
import {
	type SnippetDraftErrors,
	validateSnippetDraft,
} from "../../model/snippet-validation";
import type { SnippetDraft } from "../../model/types";
import { ConfirmDialog } from "../confirm-dialog";
import { FormField } from "../form-field";

type SnippetMetadataDialogProps = {
	open: boolean;
	mode: "create" | "edit";
	draft: SnippetDraft;
	onOpenChange: (open: boolean) => void;
	onSubmit: (draft: SnippetDraft) => void;
};

export function SnippetMetadataDialog({
	open,
	mode,
	draft,
	onOpenChange,
	onSubmit,
}: SnippetMetadataDialogProps) {
	const [initialValues] = React.useState(() => ({
		title: draft.title,
		description: draft.description,
		language: draft.language.trim() || DEFAULT_SNIPPET_LANGUAGE,
		tagsInput: draft.tags.join(", "),
	}));
	const [title, setTitle] = React.useState(initialValues.title);
	const [description, setDescription] = React.useState(
		initialValues.description,
	);
	const [language, setLanguage] = React.useState(initialValues.language);
	const [tagsInput, setTagsInput] = React.useState(initialValues.tagsInput);
	const [errors, setErrors] = React.useState<SnippetDraftErrors>({});
	const [submitError, setSubmitError] = React.useState<string | null>(null);
	const [discardOpen, setDiscardOpen] = React.useState(false);
	const titleInputRef = React.useRef<HTMLInputElement>(null);

	const isDirty =
		title !== initialValues.title ||
		description !== initialValues.description ||
		language !== initialValues.language ||
		tagsInput !== initialValues.tagsInput;

	function clearError(field: keyof SnippetDraftErrors) {
		setErrors((current) => {
			if (current[field] === undefined) {
				return current;
			}

			const next = { ...current };
			delete next[field];
			return next;
		});
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const nextDraft: SnippetDraft = {
			title,
			description,
			code: draft.code,
			language,
			tags: parseTagsInput(tagsInput),
		};
		const nextErrors = validateSnippetDraft(nextDraft);

		if (Object.keys(nextErrors).length > 0) {
			setErrors(nextErrors);
			setSubmitError(null);

			if (nextErrors.title) {
				titleInputRef.current?.focus();
			}

			return;
		}

		setErrors({});

		try {
			onSubmit(nextDraft);
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: "Could not save the snippet. Please try again.",
			);
		}
	}

	const handleOpenChange: React.ComponentProps<
		typeof Dialog
	>["onOpenChange"] = (nextOpen, eventDetails) => {
		if (nextOpen) {
			onOpenChange(true);
			return;
		}

		if (isDirty) {
			eventDetails.cancel();
			setDiscardOpen(true);
			return;
		}

		onOpenChange(false);
	};

	function handleCancel() {
		if (isDirty) {
			setDiscardOpen(true);
			return;
		}

		onOpenChange(false);
	}

	function handleDiscard() {
		setDiscardOpen(false);
		onOpenChange(false);
	}

	return (
		<>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{mode === "create" ? "Save snippet" : "Edit snippet details"}
						</DialogTitle>
						<DialogDescription>
							{mode === "create"
								? "Add details for your snippet. The code is taken from the editor."
								: "Update the snippet details and apply them to the open tab."}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} noValidate className="grid gap-4">
						{errors.code || submitError ? (
							<div
								role="alert"
								className="border-destructive/20 bg-destructive/5 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
							>
								<HugeiconsIcon
									icon={AlertCircleIcon}
									className="text-destructive mt-0.5 size-4 shrink-0"
									aria-hidden="true"
								/>
								<p className="min-w-0">{errors.code ?? submitError}</p>
							</div>
						) : null}

						<FormField
							id="snippet-title"
							label="Title"
							required
							error={errors.title}
						>
							<Input
								id="snippet-title"
								ref={titleInputRef}
								value={title}
								onChange={(event) => {
									setTitle(event.target.value);
									clearError("title");
								}}
								placeholder="e.g. Debounce hook"
								aria-invalid={errors.title ? true : undefined}
								aria-describedby={
									errors.title ? "snippet-title-error" : undefined
								}
								required
							/>
						</FormField>

						<FormField id="snippet-description" label="Description">
							<Textarea
								id="snippet-description"
								value={description}
								onChange={(event) => setDescription(event.target.value)}
								placeholder="What is this snippet for?"
								className="min-h-16 resize-y"
							/>
						</FormField>

						<FormField
							id="snippet-language"
							label="Language"
							hint="Used for syntax highlighting in the editor."
						>
							<Select
								id="snippet-language"
								value={language}
								onChange={(event) => setLanguage(event.target.value)}
								aria-describedby="snippet-language-hint"
							>
								{getLanguageOptions(language).map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</Select>
						</FormField>

						<FormField
							id="snippet-tags"
							label="Tags"
							hint="Separate tags with commas."
						>
							<Input
								id="snippet-tags"
								value={tagsInput}
								onChange={(event) => setTagsInput(event.target.value)}
								placeholder="e.g. React, hooks, UI"
								aria-describedby="snippet-tags-hint"
							/>
						</FormField>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={handleCancel}>
								Cancel
							</Button>
							<Button type="submit">
								{mode === "create" ? "Create snippet" : "Apply changes"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={discardOpen}
				onOpenChange={setDiscardOpen}
				title="Discard changes?"
				description="Your unsaved details will be lost if you close this form."
				confirmLabel="Discard changes"
				cancelLabel="Keep editing"
				onConfirm={handleDiscard}
				destructive
			/>
		</>
	);
}
