import type { Snippet } from "./types";

export const RECENT_SNIPPETS_LIMIT = 5;

function toTimestamp(value: string): number {
	const timestamp = new Date(value).getTime();

	return Number.isNaN(timestamp) ? 0 : timestamp;
}

/**
 * Returns the most recently updated snippets first.
 * The input array is never mutated.
 */
export function selectRecentSnippets(
	snippets: Snippet[],
	limit: number = RECENT_SNIPPETS_LIMIT,
): Snippet[] {
	return [...snippets]
		.sort(
			(first, second) =>
				toTimestamp(second.updatedAt) - toTimestamp(first.updatedAt),
		)
		.slice(0, Math.max(0, limit));
}
