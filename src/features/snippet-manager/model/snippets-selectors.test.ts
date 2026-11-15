import { describe, expect, it } from "bun:test";

import { selectRecentSnippets } from "./snippets-selectors";
import type { Snippet } from "./types";

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
	return {
		id: "snippet-1",
		title: "Debounce hook",
		description: "",
		code: "code",
		language: "TypeScript",
		tags: [],
		createdAt: "2026-01-01T09:00:00.000Z",
		updatedAt: "2026-01-01T09:00:00.000Z",
		...overrides,
	};
}

describe("selectRecentSnippets", () => {
	it("sorts snippets from newest to oldest by updatedAt", () => {
		const snippets = [
			makeSnippet({ id: "old", updatedAt: "2026-01-01T09:00:00.000Z" }),
			makeSnippet({ id: "newest", updatedAt: "2026-03-01T09:00:00.000Z" }),
			makeSnippet({ id: "middle", updatedAt: "2026-02-01T09:00:00.000Z" }),
		];

		expect(selectRecentSnippets(snippets).map((snippet) => snippet.id)).toEqual(
			["newest", "middle", "old"],
		);
	});

	it("limits the result to five snippets", () => {
		const snippets = Array.from({ length: 7 }, (_, index) =>
			makeSnippet({
				id: `snippet-${index}`,
				updatedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
			}),
		);

		const recent = selectRecentSnippets(snippets);

		expect(recent).toHaveLength(5);
		expect(recent.map((snippet) => snippet.id)).toEqual([
			"snippet-6",
			"snippet-5",
			"snippet-4",
			"snippet-3",
			"snippet-2",
		]);
	});

	it("respects a custom limit", () => {
		const snippets = [
			makeSnippet({ id: "a", updatedAt: "2026-01-01T09:00:00.000Z" }),
			makeSnippet({ id: "b", updatedAt: "2026-02-01T09:00:00.000Z" }),
		];

		expect(
			selectRecentSnippets(snippets, 1).map((snippet) => snippet.id),
		).toEqual(["b"]);
	});

	it("does not mutate the input array", () => {
		const snippets = [
			makeSnippet({ id: "old", updatedAt: "2026-01-01T09:00:00.000Z" }),
			makeSnippet({ id: "new", updatedAt: "2026-02-01T09:00:00.000Z" }),
		];
		const originalOrder = snippets.map((snippet) => snippet.id);

		selectRecentSnippets(snippets);

		expect(snippets.map((snippet) => snippet.id)).toEqual(originalOrder);
	});

	it("handles broken dates without throwing", () => {
		const snippets = [
			makeSnippet({ id: "broken", updatedAt: "not-a-date" }),
			makeSnippet({ id: "valid", updatedAt: "2026-01-01T09:00:00.000Z" }),
		];

		expect(selectRecentSnippets(snippets).map((snippet) => snippet.id)).toEqual(
			["valid", "broken"],
		);
	});

	it("returns an empty list for an empty collection", () => {
		expect(selectRecentSnippets([])).toEqual([]);
	});
});
