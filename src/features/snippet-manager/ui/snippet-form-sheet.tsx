"use client";

import { CheckmarkCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import {
	createSnippetDraft,
	normalizeSnippetDraft,
	parseTagsInput,
} from "../model/snippet-draft";
import {
	type SnippetDraftErrors,
	validateSnippetDraft,
} from "../model/snippet-validation";
import type { Snippet, SnippetDraft } from "../model/types";

import { ConfirmDialog } from "./confirm-dialog";

type SnippetFormSheetProps = {
	open: boolean;
	snippet: Snippet | null;
	onOpenChange: (open: boolean) => void;
	onSave: (draft: SnippetDraft) => void;
};

export function SnippetFormSheet({
	open,
	snippet,
	onOpenChange,
	onSave,
}: SnippetFormSheetProps) {
	const [initialState] = React.useState(() => ({
		draft: createSnippetDraft(snippet),
		tagsInput: snippet?.tags.join(", ") ?? "",
	}));
	const [draft, setDraft] = React.useState<SnippetDraft>(initialState.draft);
	const [tagsInput, setTagsInput] = React.useState(initialState.tagsInput);
	const [errors, setErrors] = React.useState<SnippetDraftErrors>({});
	const [discardOpen, setDiscardOpen] = React.useState(false);
	const titleInputRef = React.useRef<HTMLInputElement>(null);
	const codeInputRef = React.useRef<HTMLTextAreaElement>(null);

	const isEditing = snippet !== null;
	const isDirty =
		tagsInput !== initialState.tagsInput ||
		draft.title !== initialState.draft.title ||
		draft.description !== initialState.draft.description ||
		draft.code !== initialState.draft.code ||
		draft.language !== initialState.draft.language;

	function updateField<Key extends keyof SnippetDraft>(
		field: Key,
		value: SnippetDraft[Key],
	) {
		setDraft((current) => ({ ...current, [field]: value }));
	}

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

		const normalized = normalizeSnippetDraft({
			...draft,
			tags: parseTagsInput(tagsInput),
		});
		const nextErrors = validateSnippetDraft(normalized);

		if (Object.keys(nextErrors).length > 0) {
			setErrors(nextErrors);

			if (nextErrors.title) {
				titleInputRef.current?.focus();
			} else {
				codeInputRef.current?.focus();
			}

			return;
		}

		onSave(normalized);
	}

	const handleOpenChange: React.ComponentProps<typeof Sheet>["onOpenChange"] = (
		nextOpen,
		eventDetails,
	) => {
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
			<Sheet open={open} onOpenChange={handleOpenChange}>
				<SheetContent className="w-full sm:max-w-lg">
					<SheetHeader className="pr-10">
						<SheetTitle>
							{isEditing ? "Edit snippet" : "New snippet"}
						</SheetTitle>
						<SheetDescription>
							{isEditing
								? "Update the snippet details and save your changes."
								: "Add a reusable piece of code with the details you need later."}
						</SheetDescription>
					</SheetHeader>

					<form
						noValidate
						onSubmit={handleSubmit}
						className="flex min-h-0 flex-1 flex-col"
					>
						<div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
							<FormField
								id="snippet-title"
								label="Title"
								required
								error={errors.title}
							>
								<Input
									id="snippet-title"
									ref={titleInputRef}
									value={draft.title}
									onChange={(event) => {
										updateField("title", event.target.value);
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
									value={draft.description}
									onChange={(event) =>
										updateField("description", event.target.value)
									}
									placeholder="What is this snippet for?"
									className="min-h-20 resize-y"
								/>
							</FormField>

							<FormField
								id="snippet-code"
								label="Code"
								required
								error={errors.code}
							>
								<Textarea
									id="snippet-code"
									ref={codeInputRef}
									value={draft.code}
									onChange={(event) => {
										updateField("code", event.target.value);
										clearError("code");
									}}
									placeholder="// Paste or write your snippet here"
									spellCheck={false}
									autoCapitalize="off"
									autoCorrect="off"
									aria-invalid={errors.code ? true : undefined}
									aria-describedby={
										errors.code ? "snippet-code-error" : undefined
									}
									className="min-h-44 resize-y font-mono text-xs leading-5"
									required
								/>
							</FormField>

							<FormField
								id="snippet-language"
								label="Language"
								hint="Optional. Defaults to Text when left blank."
							>
								<Input
									id="snippet-language"
									value={draft.language}
									onChange={(event) =>
										updateField("language", event.target.value)
									}
									placeholder="e.g. TypeScript"
									aria-describedby="snippet-language-hint"
								/>
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
						</div>

						<SheetFooter className="border-t sm:flex-row sm:justify-end">
							<Button type="button" variant="outline" onClick={handleCancel}>
								Cancel
							</Button>
							<Button type="submit">
								<HugeiconsIcon
									icon={CheckmarkCircleIcon}
									className="size-3.5"
									data-icon="inline-start"
									aria-hidden="true"
								/>
								{isEditing ? "Save changes" : "Create snippet"}
							</Button>
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>

			<ConfirmDialog
				open={discardOpen}
				onOpenChange={setDiscardOpen}
				title="Discard changes?"
				description="Your unsaved changes will be lost if you close this form."
				confirmLabel="Discard changes"
				cancelLabel="Keep editing"
				onConfirm={handleDiscard}
				destructive
			/>
		</>
	);
}

type FormFieldProps = {
	id: string;
	label: string;
	required?: boolean;
	hint?: string;
	error?: string;
	children: React.ReactNode;
};

function FormField({
	id,
	label,
	required = false,
	hint,
	error,
	children,
}: FormFieldProps) {
	return (
		<div className="grid gap-1.5">
			<label htmlFor={id} className="text-sm font-medium">
				{label}
				{required ? (
					<span className="text-destructive" aria-hidden="true">
						{" "}
						*
					</span>
				) : null}
			</label>
			{children}
			{hint && !error ? (
				<p id={`${id}-hint`} className="text-muted-foreground text-xs">
					{hint}
				</p>
			) : null}
			{error ? (
				<p id={`${id}-error`} className="text-destructive text-xs" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
