import { describe, expect, it } from "bun:test";

import {
	createSnippetDraft,
	normalizeSnippetDraft,
	normalizeTags,
	parseTagsInput,
} from "./snippet-draft";
import type { Snippet, SnippetDraft } from "./types";

const snippet: Snippet = {
	id: "snippet-1",
	title: "Debounce hook",
	description: "Delays updates until the user stops typing.",
	code: "const debounced = useDebounce(value, 300);",
	language: "TypeScript",
	category: "Utilities",
	tags: ["react", "hooks"],
	isFavorite: false,
	createdAt: "2026-01-01T09:00:00.000Z",
	updatedAt: "2026-01-02T09:00:00.000Z",
};

describe("createSnippetDraft", () => {
	it("returns an empty draft for a new snippet", () => {
		expect(createSnippetDraft()).toEqual({
			title: "",
			description: "",
			code: "",
			language: "",
			category: "General",
			tags: [],
		});
	});

	it("prefills every editable field from an existing snippet", () => {
		expect(createSnippetDraft(snippet)).toEqual({
			title: snippet.title,
			description: snippet.description,
			code: snippet.code,
			language: snippet.language,
			category: snippet.category,
			tags: ["react", "hooks"],
		});
	});

	it("copies tags so editing the draft does not change the snippet", () => {
		const draft = createSnippetDraft(snippet);

		draft.tags.push("mutated");

		expect(snippet.tags).toEqual(["react", "hooks"]);
	});
});

describe("normalizeTags", () => {
	it("trims tags, drops empty values, and removes duplicates", () => {
		expect(
			normalizeTags([" react ", "", "react", "hooks", "  ", "hooks"]),
		).toEqual(["react", "hooks"]);
	});

	it("removes duplicates ignoring case and keeps the first spelling", () => {
		expect(normalizeTags(["React", "react", "REACT", "hooks"])).toEqual([
			"React",
			"hooks",
		]);
	});
});

describe("parseTagsInput", () => {
	it("parses a comma-separated tag input", () => {
		expect(parseTagsInput(" React, hooks ,, UI, React ")).toEqual([
			"React",
			"hooks",
			"UI",
		]);
	});

	it("returns an empty list for blank input", () => {
		expect(parseTagsInput("   ")).toEqual([]);
	});
});

describe("normalizeSnippetDraft", () => {
	it("trims text fields, keeps code intact, and defaults the language", () => {
		expect(
			normalizeSnippetDraft({
				title: "  Debounce hook  ",
				description: "  Delays updates.  ",
				code: "\nconst value = 1;\n",
				language: "   ",
				category: "API",
				tags: [" react ", "", "react", "hooks"],
			}),
		).toEqual({
			title: "Debounce hook",
			description: "Delays updates.",
			code: "\nconst value = 1;\n",
			language: "Text",
			category: "API",
			tags: ["react", "hooks"],
		});
	});

	it("keeps a provided language", () => {
		expect(
			normalizeSnippetDraft({
				title: "Title",
				description: "",
				code: "code",
				language: "  TypeScript  ",
				category: "General",
				tags: [],
			}).language,
		).toBe("TypeScript");
	});

	it("keeps a known category and defaults an unknown one", () => {
		expect(
			normalizeSnippetDraft({
				title: "Title",
				description: "",
				code: "code",
				language: "Text",
				category: "Testing",
				tags: [],
			}).category,
		).toBe("Testing");

		expect(
			normalizeSnippetDraft({
				title: "Title",
				description: "",
				code: "code",
				language: "Text",
				category: "Unknown" as SnippetDraft["category"],
				tags: [],
			}).category,
		).toBe("General");
	});
});
