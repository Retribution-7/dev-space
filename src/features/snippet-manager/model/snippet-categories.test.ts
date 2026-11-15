import { describe, expect, it } from "bun:test";

import {
	DEFAULT_SNIPPET_CATEGORY,
	isSnippetCategory,
	normalizeSnippetCategory,
	SNIPPET_CATEGORIES,
} from "./snippet-categories";

describe("snippet categories", () => {
	it("offers the fixed set of categories with General as the default", () => {
		expect(SNIPPET_CATEGORIES).toEqual([
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
		]);
		expect(DEFAULT_SNIPPET_CATEGORY).toBe("General");
	});

	it("recognizes known categories only", () => {
		expect(isSnippetCategory("API")).toBe(true);
		expect(isSnippetCategory("api")).toBe(false);
		expect(isSnippetCategory("Legacy")).toBe(false);
		expect(isSnippetCategory(undefined)).toBe(false);
		expect(isSnippetCategory(42)).toBe(false);
	});

	it("keeps known categories and defaults unknown ones", () => {
		expect(normalizeSnippetCategory("DevOps")).toBe("DevOps");
		expect(normalizeSnippetCategory("Unknown")).toBe("General");
		expect(normalizeSnippetCategory(undefined)).toBe("General");
		expect(normalizeSnippetCategory(null)).toBe("General");
	});
});
