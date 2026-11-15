export const SNIPPET_CATEGORIES = [
	"General",
	"UI Components",
	"API",
	"Authentication",
	"Database",
	"Utilities",
	"Testing",
	"Configuration",
	"DevOps",
	"Algorithms",
] as const;

export type SnippetCategory = (typeof SNIPPET_CATEGORIES)[number];

export const DEFAULT_SNIPPET_CATEGORY: SnippetCategory = "General";

export function isSnippetCategory(value: unknown): value is SnippetCategory {
	return (
		typeof value === "string" &&
		(SNIPPET_CATEGORIES as readonly string[]).includes(value)
	);
}

/**
 * Returns the given category when it is known and the default one otherwise.
 * Unknown categories are never saved as they are.
 */
export function normalizeSnippetCategory(value: unknown): SnippetCategory {
	return isSnippetCategory(value) ? value : DEFAULT_SNIPPET_CATEGORY;
}
