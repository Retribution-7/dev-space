import type { Snippet, SnippetDraft } from "./types";

export const DEFAULT_SNIPPET_LANGUAGE = "Text";

export function createSnippetDraft(snippet?: Snippet | null): SnippetDraft {
	if (!snippet) {
		return {
			title: "",
			description: "",
			code: "",
			language: "",
			tags: [],
		};
	}

	return {
		title: snippet.title,
		description: snippet.description,
		code: snippet.code,
		language: snippet.language,
		tags: [...snippet.tags],
	};
}

export function normalizeTags(tags: string[]): string[] {
	const normalized: string[] = [];

	for (const rawTag of tags) {
		const tag = rawTag.trim();

		if (tag.length > 0 && !normalized.includes(tag)) {
			normalized.push(tag);
		}
	}

	return normalized;
}

export function parseTagsInput(value: string): string[] {
	return normalizeTags(value.split(","));
}

export function normalizeSnippetDraft(draft: SnippetDraft): SnippetDraft {
	return {
		title: draft.title.trim(),
		description: draft.description.trim(),
		code: draft.code,
		language: draft.language.trim() || DEFAULT_SNIPPET_LANGUAGE,
		tags: normalizeTags(draft.tags),
	};
}
