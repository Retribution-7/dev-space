import { describe, expect, it } from "bun:test";

import {
	createSnippetDraft,
	normalizeSnippetDraft,
	normalizeTags,
	parseTagsInput,
} from "./snippet-draft";
import type { Snippet } from "./types";

const snippet: Snippet = {
	id: "snippet-1",
	title: "Debounce hook",
	description: "Delays updates until the user stops typing.",
	code: "const debounced = useDebounce(value, 300);",
	language: "TypeScript",
	tags: ["react", "hooks"],
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
			tags: [],
		});
	});

	it("prefills every editable field from an existing snippet", () => {
		expect(createSnippetDraft(snippet)).toEqual({
			title: snippet.title,
			description: snippet.description,
			code: snippet.code,
			language: snippet.language,
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
				tags: [" react ", "", "react", "hooks"],
			}),
		).toEqual({
			title: "Debounce hook",
			description: "Delays updates.",
			code: "\nconst value = 1;\n",
			language: "Text",
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
				tags: [],
			}).language,
		).toBe("TypeScript");
	});
});
