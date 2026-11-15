import type { Snippet } from "./types";

export type SnippetsSortOption =
	| "recently-updated"
	| "oldest-updated"
	| "recently-created"
	| "oldest-created"
	| "name-asc"
	| "name-desc";

export const DEFAULT_SNIPPET_SORT: SnippetsSortOption = "recently-updated";

export const SNIPPET_SORT_OPTIONS: {
	value: SnippetsSortOption;
	label: string;
}[] = [
	{ value: "recently-updated", label: "Recently Updated" },
	{ value: "oldest-updated", label: "Oldest Updated" },
	{ value: "recently-created", label: "Recently Created" },
	{ value: "oldest-created", label: "Oldest Created" },
	{ value: "name-asc", label: "Name A–Z" },
	{ value: "name-desc", label: "Name Z–A" },
];

const nameCollator = new Intl.Collator(undefined, {
	sensitivity: "base",
	numeric: true,
});

function toTimestamp(value: string): number {
	const timestamp = new Date(value).getTime();

	return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compareNumbersAscending(first: number, second: number): number {
	return first - second;
}

function compareSnippets(
	first: Snippet,
	second: Snippet,
	option: SnippetsSortOption,
): number {
	switch (option) {
		case "recently-updated":
			return compareNumbersAscending(
				toTimestamp(second.updatedAt),
				toTimestamp(first.updatedAt),
			);
		case "oldest-updated":
			return compareNumbersAscending(
				toTimestamp(first.updatedAt),
				toTimestamp(second.updatedAt),
			);
		case "recently-created":
			return compareNumbersAscending(
				toTimestamp(second.createdAt),
				toTimestamp(first.createdAt),
			);
		case "oldest-created":
			return compareNumbersAscending(
				toTimestamp(first.createdAt),
				toTimestamp(second.createdAt),
			);
		case "name-asc":
			return nameCollator.compare(first.title, second.title);
		case "name-desc":
			return nameCollator.compare(second.title, first.title);
	}
}

/**
 * Returns a new array with snippets ordered by the selected option.
 * The source collection is never mutated; equal values keep their original
 * relative order (stable sorting).
 */
export function sortSnippets(
	snippets: Snippet[],
	option: SnippetsSortOption,
): Snippet[] {
	return [...snippets].sort((first, second) =>
		compareSnippets(first, second, option),
	);
}
