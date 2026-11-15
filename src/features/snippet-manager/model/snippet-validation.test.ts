import { describe, expect, it } from "bun:test";

import { validateSnippetDraft } from "./snippet-validation";
import type { SnippetDraft } from "./types";

function makeDraft(overrides: Partial<SnippetDraft> = {}): SnippetDraft {
	return {
		title: "Debounce hook",
		description: "",
		code: "const value = 1;",
		language: "TypeScript",
		tags: [],
		...overrides,
	};
}

describe("validateSnippetDraft", () => {
	it("accepts a draft with a title and code", () => {
		expect(validateSnippetDraft(makeDraft())).toEqual({});
	});

	it("requires a title", () => {
		expect(validateSnippetDraft(makeDraft({ title: "" }))).toEqual({
			title: "Title is required.",
		});
	});

	it("rejects a whitespace-only title", () => {
		expect(validateSnippetDraft(makeDraft({ title: "   " }))).toEqual({
			title: "Title is required.",
		});
	});

	it("requires code", () => {
		expect(validateSnippetDraft(makeDraft({ code: "" }))).toEqual({
			code: "Code is required.",
		});
	});

	it("rejects whitespace-only code", () => {
		expect(validateSnippetDraft(makeDraft({ code: " \n\t " }))).toEqual({
			code: "Code is required.",
		});
	});

	it("reports both required fields at once", () => {
		expect(validateSnippetDraft(makeDraft({ title: " ", code: "" }))).toEqual({
			title: "Title is required.",
			code: "Code is required.",
		});
	});
});
