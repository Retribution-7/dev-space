import type { Snippet, SnippetDraft } from "./types";

type CreateSnippetOptions = {
	id: string;
	timestamp: string;
};

export function createSnippet(
	draft: SnippetDraft,
	{ id, timestamp }: CreateSnippetOptions,
): Snippet {
	return {
		id,
		...draft,
		tags: [...draft.tags],
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}

export function updateSnippet(
	snippet: Snippet,
	draft: SnippetDraft,
	timestamp: string,
): Snippet {
	return {
		...snippet,
		...draft,
		tags: [...draft.tags],
		updatedAt: timestamp,
	};
}

export function removeSnippet(snippets: Snippet[], id: string): Snippet[] {
	return snippets.filter((snippet) => snippet.id !== id);
}
