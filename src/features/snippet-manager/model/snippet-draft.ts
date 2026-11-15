import {
	DEFAULT_SNIPPET_CATEGORY,
	normalizeSnippetCategory,
} from "./snippet-categories";
import type { Snippet, SnippetDraft } from "./types";

export const DEFAULT_SNIPPET_LANGUAGE = "Text";

export function createSnippetDraft(snippet?: Snippet | null): SnippetDraft {
	if (!snippet) {
		return {
			title: "",
			description: "",
			code: "",
			language: "",
			category: DEFAULT_SNIPPET_CATEGORY,
			tags: [],
		};
	}

	return {
		title: snippet.title,
		description: snippet.description,
		code: snippet.code,
		language: snippet.language,
		category: snippet.category,
		tags: [...snippet.tags],
	};
}

/**
 * Trims tags, drops empty ones, and removes case-insensitive duplicates
 * keeping the first spelling. Existing tag spelling is preserved.
 */
export function normalizeTags(tags: string[]): string[] {
	const normalized: string[] = [];
	const seen = new Set<string>();

	for (const rawTag of tags) {
		const tag = rawTag.trim();
		const key = tag.toLowerCase();

		if (tag.length > 0 && !seen.has(key)) {
			seen.add(key);
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
		category: normalizeSnippetCategory(draft.category),
		tags: normalizeTags(draft.tags),
	};
}
