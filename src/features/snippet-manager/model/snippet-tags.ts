export type RecommendedTagGroup = {
	group: string;
	tags: string[];
};

/**
 * Central catalog of recommended tags used for autocomplete hints.
 * It is a hint source only: snippets may carry tags outside of the catalog.
 */
export const RECOMMENDED_TAGS: RecommendedTagGroup[] = [
	{
		group: "Languages",
		tags: [
			"typescript",
			"javascript",
			"python",
			"sql",
			"java",
			"go",
			"rust",
			"php",
			"csharp",
			"cpp",
		],
	},
	{
		group: "Frontend",
		tags: [
			"react",
			"nextjs",
			"vue",
			"angular",
			"html",
			"css",
			"tailwind",
			"responsive",
			"component",
			"hooks",
		],
	},
	{
		group: "Backend",
		tags: [
			"nodejs",
			"express",
			"api",
			"rest",
			"graphql",
			"middleware",
			"server",
			"routing",
			"websocket",
		],
	},
	{
		group: "Data",
		tags: [
			"json",
			"xml",
			"yaml",
			"csv",
			"parser",
			"serializer",
			"deserializer",
			"formatter",
		],
	},
	{
		group: "Database",
		tags: [
			"postgresql",
			"mysql",
			"mongodb",
			"redis",
			"sqlite",
			"query",
			"schema",
			"migration",
		],
	},
	{
		group: "Concepts",
		tags: [
			"async",
			"await",
			"promise",
			"recursion",
			"algorithm",
			"functional",
			"oop",
			"types",
			"generics",
			"error-handling",
		],
	},
	{
		group: "Tools",
		tags: [
			"utility",
			"formatter",
			"validator",
			"converter",
			"generator",
			"cli",
			"script",
			"helper",
		],
	},
	{
		group: "Testing",
		tags: ["unit-test", "integration-test", "e2e", "mock", "stub", "testing"],
	},
	{
		group: "Security",
		tags: [
			"auth",
			"jwt",
			"encryption",
			"hashing",
			"validation",
			"security",
			"permissions",
			"token",
		],
	},
	{
		group: "Architecture",
		tags: [
			"service",
			"repository",
			"factory",
			"adapter",
			"singleton",
			"dependency-injection",
			"design-pattern",
			"clean-architecture",
		],
	},
];

export type TagSuggestion =
	{ type: "recommended"; tag: string } | { type: "custom"; tag: string };

const canonicalTagByLowercase = new Map<string, string>();
const recommendedTags: string[] = [];

for (const { tags } of RECOMMENDED_TAGS) {
	for (const tag of tags) {
		const key = tag.toLowerCase();

		if (!canonicalTagByLowercase.has(key)) {
			canonicalTagByLowercase.set(key, tag);
			recommendedTags.push(tag);
		}
	}
}

/** Returns the catalog spelling of a tag when it is recommended. */
export function findCanonicalTag(value: string): string | null {
	return canonicalTagByLowercase.get(value.trim().toLowerCase()) ?? null;
}

/**
 * Adds a tag to a tag list following the shared normalization rules:
 * surrounding spaces are removed, empty values are ignored, catalog matches
 * use the recommended spelling, and duplicates (case-insensitive) are skipped.
 */
export function addTag(tags: string[], value: string): string[] {
	const trimmed = value.trim();

	if (trimmed === "") {
		return tags;
	}

	const tag = findCanonicalTag(trimmed) ?? trimmed;

	if (tags.some((item) => item.trim().toLowerCase() === tag.toLowerCase())) {
		return tags;
	}

	return [...tags, tag];
}

/** Removes a tag from a tag list ignoring case. */
export function removeTag(tags: string[], value: string): string[] {
	const target = value.trim().toLowerCase();

	return tags.filter((tag) => tag.trim().toLowerCase() !== target);
}

function matchRank(tag: string, query: string): number {
	const normalized = tag.toLowerCase();

	if (normalized === query) {
		return 0;
	}

	if (normalized.startsWith(query)) {
		return 1;
	}

	return 2;
}

/**
 * Returns autocomplete suggestions for the typed input: recommended tags
 * matching the input (without already added ones) plus an action for adding
 * a custom tag when the input is not an exact catalog match.
 */
export function getTagSuggestions(
	input: string,
	existingTags: string[],
): TagSuggestion[] {
	const query = input.trim().toLowerCase();

	if (query === "") {
		return [];
	}

	const existing = new Set(existingTags.map((tag) => tag.trim().toLowerCase()));

	const matches = recommendedTags
		.filter(
			(tag) =>
				!existing.has(tag.toLowerCase()) && tag.toLowerCase().includes(query),
		)
		.sort(
			(first, second) =>
				matchRank(first, query) - matchRank(second, query) ||
				first.localeCompare(second),
		)
		.map((tag): TagSuggestion => ({ type: "recommended", tag }));

	const isDuplicate = existing.has(query);
	const isRecommended = canonicalTagByLowercase.has(query);

	if (!isDuplicate && !isRecommended) {
		matches.push({ type: "custom", tag: input.trim() });
	}

	return matches;
}
