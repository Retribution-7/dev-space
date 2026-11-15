import { describe, expect, it } from "bun:test";

import {
	DEFAULT_SNIPPET_SORT,
	SNIPPET_SORT_OPTIONS,
	type SnippetsSortOption,
	sortSnippets,
} from "./snippets-sort";
import type { Snippet } from "./types";

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
	return {
		id: "snippet-1",
		title: "Alpha",
		description: "",
		code: "code",
		language: "TypeScript",
		tags: [],
		isFavorite: false,
		createdAt: "2026-01-01T09:00:00.000Z",
		updatedAt: "2026-01-10T09:00:00.000Z",
		...overrides,
	};
}

const alpha = makeSnippet({
	id: "alpha",
	title: "Alpha",
	createdAt: "2026-01-01T09:00:00.000Z",
	updatedAt: "2026-01-10T09:00:00.000Z",
});
const beta = makeSnippet({
	id: "beta",
	title: "beta",
	createdAt: "2026-01-02T09:00:00.000Z",
	updatedAt: "2026-01-05T09:00:00.000Z",
});
const gamma = makeSnippet({
	id: "gamma",
	title: "Bravo",
	createdAt: "2026-01-03T09:00:00.000Z",
	updatedAt: "2026-01-15T09:00:00.000Z",
});
const snippets = [alpha, beta, gamma];

function sortedIds(option: SnippetsSortOption, items: Snippet[] = snippets) {
	return sortSnippets(items, option).map((snippet) => snippet.id);
}

describe("SNIPPET_SORT_OPTIONS", () => {
	it("offers every sort option with Recently Updated as the default", () => {
		expect(SNIPPET_SORT_OPTIONS.map((option) => option.value)).toEqual([
			"recently-updated",
			"oldest-updated",
			"recently-created",
			"oldest-created",
			"name-asc",
			"name-desc",
		]);
		expect(DEFAULT_SNIPPET_SORT).toBe("recently-updated");
	});
});

describe("sortSnippets", () => {
	it("sorts by recently updated", () => {
		expect(sortedIds("recently-updated")).toEqual(["gamma", "alpha", "beta"]);
	});

	it("sorts by oldest updated", () => {
		expect(sortedIds("oldest-updated")).toEqual(["beta", "alpha", "gamma"]);
	});

	it("sorts by recently created", () => {
		expect(sortedIds("recently-created")).toEqual(["gamma", "beta", "alpha"]);
	});

	it("sorts by oldest created", () => {
		expect(sortedIds("oldest-created")).toEqual(["alpha", "beta", "gamma"]);
	});

	it("sorts by name alphabetically", () => {
		expect(sortedIds("name-asc")).toEqual(["alpha", "beta", "gamma"]);
	});

	it("sorts by name in reverse order", () => {
		expect(sortedIds("name-desc")).toEqual(["gamma", "beta", "alpha"]);
	});

	it("compares names without case sensitivity", () => {
		const items = [
			makeSnippet({ id: "zebra", title: "Zebra" }),
			makeSnippet({ id: "apple", title: "apple" }),
		];

		expect(sortedIds("name-asc", items)).toEqual(["apple", "zebra"]);
		expect(sortedIds("name-desc", items)).toEqual(["zebra", "apple"]);
	});

	it("keeps the original order for equal values", () => {
		const first = makeSnippet({
			id: "first",
			title: "Same date",
			updatedAt: "2026-01-10T09:00:00.000Z",
		});
		const second = makeSnippet({
			id: "second",
			title: "Same date",
			updatedAt: "2026-01-10T09:00:00.000Z",
		});
		const third = makeSnippet({
			id: "third",
			title: "Same date",
			updatedAt: "2026-01-10T09:00:00.000Z",
		});

		expect(sortedIds("recently-updated", [first, second, third])).toEqual([
			"first",
			"second",
			"third",
		]);
		expect(sortedIds("oldest-created", [first, second, third])).toEqual([
			"first",
			"second",
			"third",
		]);
		expect(sortedIds("name-asc", [first, second, third])).toEqual([
			"first",
			"second",
			"third",
		]);
	});

	it("treats broken dates as the oldest ones", () => {
		const broken = makeSnippet({
			id: "broken",
			title: "Broken",
			updatedAt: "not-a-date",
			createdAt: "not-a-date",
		});

		expect(sortedIds("recently-updated", [alpha, broken])).toEqual([
			"alpha",
			"broken",
		]);
		expect(sortedIds("oldest-created", [alpha, broken])).toEqual([
			"broken",
			"alpha",
		]);
	});

	it("returns an empty array for an empty collection", () => {
		expect(sortSnippets([], "recently-updated")).toEqual([]);
	});

	it("does not mutate the source collection", () => {
		const items = [beta, gamma, alpha];
		const originalOrder = items.map((snippet) => snippet.id);

		const result = sortSnippets(items, "name-asc");

		expect(items.map((snippet) => snippet.id)).toEqual(originalOrder);
		expect(result).not.toBe(items);
		expect(result.map((snippet) => snippet.id)).toEqual([
			"alpha",
			"beta",
			"gamma",
		]);
	});
});
