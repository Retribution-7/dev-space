import { describe, expect, it } from "bun:test";

import {
	countActiveFilters,
	createCustomDateRange,
	EMPTY_SNIPPETS_FILTER,
	filterSnippets,
	getAvailableLanguages,
	getAvailableTags,
	isFilterActive,
	type SnippetsFilterState,
} from "./snippets-filter";
import type { Snippet } from "./types";

const NOW = Date.parse("2026-01-15T12:00:00.000Z");
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
	return {
		id: "snippet-1",
		title: "Debounce hook",
		description: "Delays updates until typing stops.",
		code: "const value = useDebounce(input, 300);",
		language: "TypeScript",
		tags: ["react", "hooks"],
		createdAt: "2026-01-01T09:00:00.000Z",
		updatedAt: new Date(NOW - DAY_IN_MS).toISOString(),
		...overrides,
	};
}

function makeFilter(
	overrides: Partial<SnippetsFilterState> = {},
): SnippetsFilterState {
	return { ...EMPTY_SNIPPETS_FILTER, ...overrides };
}

const debounceSnippet = makeSnippet();
const formatSnippet = makeSnippet({
	id: "snippet-2",
	title: "JSON formatter",
	description: "Pretty prints JSON documents.",
	code: "JSON.stringify(value, null, 2);",
	language: "JavaScript",
	tags: ["json", "tools"],
	updatedAt: new Date(NOW - 10 * DAY_IN_MS).toISOString(),
});
const oldSnippet = makeSnippet({
	id: "snippet-3",
	title: "Legacy migration",
	description: "Moves data between databases.",
	code: "migrate(rows);",
	language: "Python",
	tags: ["database"],
	updatedAt: new Date(NOW - 40 * DAY_IN_MS).toISOString(),
});
const allSnippets = [debounceSnippet, formatSnippet, oldSnippet];

describe("filterSnippets by search query", () => {
	it("matches the title", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ query: "formatter" }), NOW).map(
				(snippet) => snippet.id,
			),
		).toEqual(["snippet-2"]);
	});

	it("matches the description", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ query: "typing stops" }), NOW),
		).toHaveLength(1);
	});

	it("matches the code content", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ query: "stringify" }), NOW).map(
				(snippet) => snippet.id,
			),
		).toEqual(["snippet-2"]);
	});

	it("matches tags", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ query: "hooks" }), NOW).map(
				(snippet) => snippet.id,
			),
		).toEqual(["snippet-1"]);
	});

	it("matches the language", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ query: "python" }), NOW).map(
				(snippet) => snippet.id,
			),
		).toEqual(["snippet-3"]);
	});

	it("ignores case and supports partial matches", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ query: "DEBO" }), NOW).map(
				(snippet) => snippet.id,
			),
		).toEqual(["snippet-1"]);
	});

	it("ignores spaces around the query", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ query: "  json  " }), NOW),
		).toHaveLength(1);
	});

	it("returns everything for an empty or blank query", () => {
		expect(filterSnippets(allSnippets, makeFilter(), NOW)).toHaveLength(3);
		expect(
			filterSnippets(allSnippets, makeFilter({ query: "   " }), NOW),
		).toHaveLength(3);
	});

	it("returns no snippets when nothing matches", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ query: "missing" }), NOW),
		).toEqual([]);
	});
});

describe("filterSnippets by language", () => {
	it("keeps only snippets of the selected language", () => {
		expect(
			filterSnippets(
				allSnippets,
				makeFilter({ language: "JavaScript" }),
				NOW,
			).map((snippet) => snippet.id),
		).toEqual(["snippet-2"]);
	});

	it("matches the language regardless of case", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ language: "python" }), NOW),
		).toHaveLength(1);
	});

	it("returns everything for All Languages", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ language: null }), NOW),
		).toHaveLength(3);
	});
});

describe("filterSnippets by tags", () => {
	it("keeps snippets containing the selected tag", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ tags: ["react"] }), NOW).map(
				(snippet) => snippet.id,
			),
		).toEqual(["snippet-1"]);
	});

	it("requires every selected tag to be present", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ tags: ["react", "json"] }), NOW),
		).toEqual([]);

		expect(
			filterSnippets(
				allSnippets,
				makeFilter({ tags: ["react", "hooks"] }),
				NOW,
			).map((snippet) => snippet.id),
		).toEqual(["snippet-1"]);
	});

	it("matches tags regardless of case", () => {
		expect(
			filterSnippets(allSnippets, makeFilter({ tags: ["REACT"] }), NOW),
		).toHaveLength(1);
	});
});

describe("filterSnippets by date updated", () => {
	it("keeps snippets updated within the last 7 days", () => {
		expect(
			filterSnippets(
				allSnippets,
				makeFilter({ dateRange: { type: "last-days", days: 7 } }),
				NOW,
			).map((snippet) => snippet.id),
		).toEqual(["snippet-1"]);
	});

	it("keeps snippets updated within the last 30 days", () => {
		expect(
			filterSnippets(
				allSnippets,
				makeFilter({ dateRange: { type: "last-days", days: 30 } }),
				NOW,
			).map((snippet) => snippet.id),
		).toEqual(["snippet-1", "snippet-2"]);
	});

	it("returns everything for All Time", () => {
		expect(
			filterSnippets(
				allSnippets,
				makeFilter({ dateRange: { type: "all" } }),
				NOW,
			),
		).toHaveLength(3);
	});

	it("filters by a custom range covering whole days", () => {
		const inside = makeSnippet({
			id: "inside",
			updatedAt: new Date(2026, 0, 5, 23, 30).toISOString(),
		});
		const before = makeSnippet({
			id: "before",
			updatedAt: new Date(2025, 11, 31, 23, 59).toISOString(),
		});
		const after = makeSnippet({
			id: "after",
			updatedAt: new Date(2026, 0, 6, 0, 0).toISOString(),
		});

		const range = createCustomDateRange(
			new Date(2026, 0, 1),
			new Date(2026, 0, 5),
		);

		expect(
			filterSnippets(
				[before, inside, after],
				makeFilter({ dateRange: range }),
			).map((snippet) => snippet.id),
		).toEqual(["inside"]);
	});

	it("treats both ends of a custom range as inclusive", () => {
		const firstDay = makeSnippet({
			id: "first",
			updatedAt: new Date(2026, 0, 1, 0, 0).toISOString(),
		});
		const lastDay = makeSnippet({
			id: "last",
			updatedAt: new Date(2026, 0, 5, 23, 59).toISOString(),
		});

		expect(
			filterSnippets(
				[firstDay, lastDay],
				makeFilter({
					dateRange: createCustomDateRange(
						new Date(2026, 0, 1),
						new Date(2026, 0, 5),
					),
				}),
			).map((snippet) => snippet.id),
		).toEqual(["first", "last"]);
	});

	it("swaps a reversed custom range", () => {
		const range = createCustomDateRange(
			new Date(2026, 0, 5),
			new Date(2026, 0, 1),
		);

		expect(range).toEqual({
			type: "custom",
			from: new Date(2026, 0, 1),
			to: new Date(2026, 0, 5),
		});
	});

	it("treats broken dates as too old", () => {
		const broken = makeSnippet({ id: "broken", updatedAt: "not-a-date" });

		expect(
			filterSnippets(
				[broken],
				makeFilter({ dateRange: { type: "last-days", days: 7 } }),
				NOW,
			),
		).toEqual([]);
		expect(
			filterSnippets([broken], makeFilter({ dateRange: { type: "all" } }), NOW),
		).toHaveLength(1);
	});
});

describe("filterSnippets with search and filters combined", () => {
	it("applies the query and the filters at the same time", () => {
		expect(
			filterSnippets(
				allSnippets,
				makeFilter({ query: "e", language: "TypeScript" }),
				NOW,
			).map((snippet) => snippet.id),
		).toEqual(["snippet-1"]);

		expect(
			filterSnippets(
				allSnippets,
				makeFilter({ query: "e", language: "TypeScript", tags: ["json"] }),
				NOW,
			),
		).toEqual([]);
	});

	it("applies tags and the date range together", () => {
		expect(
			filterSnippets(
				allSnippets,
				makeFilter({
					tags: ["hooks"],
					dateRange: { type: "last-days", days: 30 },
				}),
				NOW,
			).map((snippet) => snippet.id),
		).toEqual(["snippet-1"]);
	});

	it("applies a custom range together with the query", () => {
		expect(
			filterSnippets(
				allSnippets,
				makeFilter({
					query: "json",
					dateRange: createCustomDateRange(
						new Date(2025, 11, 20),
						new Date(2026, 0, 12),
					),
				}),
				NOW,
			).map((snippet) => snippet.id),
		).toEqual(["snippet-2"]);
	});
});

describe("filterSnippets immutability", () => {
	it("does not mutate the source collection", () => {
		const snippets = [...allSnippets];
		const originalOrder = snippets.map((snippet) => snippet.id);

		const result = filterSnippets(snippets, makeFilter({ query: "json" }), NOW);

		expect(snippets.map((snippet) => snippet.id)).toEqual(originalOrder);
		expect(result).not.toBe(snippets);
		expect(allSnippets.map((snippet) => snippet.id)).toEqual(originalOrder);
	});
});

describe("getAvailableLanguages", () => {
	it("collects unique languages in alphabetical order", () => {
		const snippets = [
			makeSnippet({ language: "TypeScript" }),
			makeSnippet({ language: "typescript" }),
			makeSnippet({ language: "Python" }),
		];

		expect(getAvailableLanguages(snippets)).toEqual(["Python", "TypeScript"]);
	});
});

describe("getAvailableTags", () => {
	it("collects unique tags in alphabetical order", () => {
		const snippets = [
			makeSnippet({ tags: ["react", "hooks", "React"] }),
			makeSnippet({ tags: ["database"] }),
		];

		expect(getAvailableTags(snippets)).toEqual(["database", "hooks", "react"]);
	});
});

describe("countActiveFilters and isFilterActive", () => {
	it("counts active filter groups", () => {
		expect(countActiveFilters(makeFilter())).toBe(0);
		expect(countActiveFilters(makeFilter({ query: "react" }))).toBe(0);
		expect(countActiveFilters(makeFilter({ language: "Python" }))).toBe(1);
		expect(countActiveFilters(makeFilter({ tags: ["react", "json"] }))).toBe(1);
		expect(
			countActiveFilters(
				makeFilter({ dateRange: { type: "last-days", days: 7 } }),
			),
		).toBe(1);
		expect(
			countActiveFilters(
				makeFilter({
					dateRange: createCustomDateRange(
						new Date(2026, 0, 1),
						new Date(2026, 0, 5),
					),
				}),
			),
		).toBe(1);
		expect(
			countActiveFilters(
				makeFilter({
					language: "Python",
					tags: ["x"],
					dateRange: { type: "last-days", days: 30 },
				}),
			),
		).toBe(3);
	});

	it("detects any deviation from the defaults", () => {
		expect(isFilterActive(makeFilter())).toBe(false);
		expect(isFilterActive(makeFilter({ query: "  " }))).toBe(false);
		expect(isFilterActive(makeFilter({ query: "react" }))).toBe(true);
		expect(isFilterActive(makeFilter({ tags: ["react"] }))).toBe(true);
		expect(
			isFilterActive(makeFilter({ dateRange: { type: "last-days", days: 7 } })),
		).toBe(true);
		expect(
			isFilterActive(
				makeFilter({
					dateRange: createCustomDateRange(
						new Date(2026, 0, 1),
						new Date(2026, 0, 5),
					),
				}),
			),
		).toBe(true);
	});
});
