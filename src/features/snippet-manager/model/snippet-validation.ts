import type { SnippetDraft } from "./types";

export type SnippetDraftErrors = Partial<Record<"title" | "code", string>>;

export function validateSnippetDraft(draft: SnippetDraft): SnippetDraftErrors {
	const errors: SnippetDraftErrors = {};

	if (draft.title.trim().length === 0) {
		errors.title = "Title is required.";
	}

	if (draft.code.trim().length === 0) {
		errors.code = "Code is required.";
	}

	return errors;
}
