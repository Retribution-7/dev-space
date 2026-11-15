import { describe, expect, it } from "bun:test";

import {
	createSnippet,
	removeSnippet,
	setSnippetFavorite,
	updateSnippet,
} from "./snippet-operations";
import type { Snippet, SnippetDraft } from "./types";

const TIMESTAMP = "2026-01-15T10:00:00.000Z";

function makeDraft(overrides: Partial<SnippetDraft> = {}): SnippetDraft {
	return {
		title: "Debounce hook",
		description: "Delays updates until the user stops typing.",
		code: "const debounced = useDebounce(value, 300);",
		language: "TypeScript",
		category: "General",
		tags: ["react", "hooks"],
		...overrides,
	};
}

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
	return {
		id: "snippet-1",
		...makeDraft(),
		isFavorite: false,
		createdAt: "2026-01-01T09:00:00.000Z",
		updatedAt: "2026-01-02T09:00:00.000Z",
		...overrides,
	};
}

describe("createSnippet", () => {
	it("uses the provided id and creation timestamps", () => {
		const snippet = createSnippet(makeDraft(), {
			id: "snippet-1",
			timestamp: TIMESTAMP,
		});

		expect(snippet).toEqual({
			...makeDraft(),
			id: "snippet-1",
			isFavorite: false,
			createdAt: TIMESTAMP,
			updatedAt: TIMESTAMP,
		});
	});

	it("copies tags so later draft changes do not affect the snippet", () => {
		const draft = makeDraft();
		const snippet = createSnippet(draft, {
			id: "snippet-1",
			timestamp: TIMESTAMP,
		});

		draft.tags.push("mutated");

		expect(snippet.tags).toEqual(["react", "hooks"]);
	});
});

describe("updateSnippet", () => {
	it("preserves identity and creation time while refreshing updatedAt", () => {
		const snippet = makeSnippet();
		const updated = updateSnippet(
			snippet,
			makeDraft({ title: "Improved debounce hook", code: "updated()" }),
			TIMESTAMP,
		);

		expect(updated).toEqual({
			...snippet,
			...makeDraft({ title: "Improved debounce hook", code: "updated()" }),
			tags: ["react", "hooks"],
			updatedAt: TIMESTAMP,
		});
		expect(updated.id).toBe(snippet.id);
		expect(updated.createdAt).toBe(snippet.createdAt);
	});

	it("does not mutate the original snippet", () => {
		const snippet = makeSnippet();
		const original = { ...snippet, tags: [...snippet.tags] };

		updateSnippet(snippet, makeDraft({ title: "New title" }), TIMESTAMP);

		expect(snippet).toEqual(original);
	});
});

describe("setSnippetFavorite", () => {
	it("marks a snippet as favorite and back", () => {
		const snippet = makeSnippet();

		const favorite = setSnippetFavorite(snippet, true);
		expect(favorite.isFavorite).toBe(true);
		expect(setSnippetFavorite(favorite, false).isFavorite).toBe(false);
	});

	it("does not change content or timestamps", () => {
		const snippet = makeSnippet();

		expect(setSnippetFavorite(snippet, true)).toEqual({
			...snippet,
			isFavorite: true,
		});
	});

	it("does not mutate the original snippet", () => {
		const snippet = makeSnippet();

		setSnippetFavorite(snippet, true);

		expect(snippet.isFavorite).toBe(false);
	});
});

describe("removeSnippet", () => {
	it("removes only the matching snippet", () => {
		const first = makeSnippet({ id: "snippet-1" });
		const second = makeSnippet({ id: "snippet-2" });

		expect(removeSnippet([first, second], "snippet-1")).toEqual([second]);
	});

	it("returns an empty list after removing the last snippet", () => {
		const snippet = makeSnippet();

		expect(removeSnippet([snippet], snippet.id)).toEqual([]);
	});

	it("keeps the list unchanged for an unknown id", () => {
		const snippets = [makeSnippet()];

		expect(removeSnippet(snippets, "missing")).toEqual(snippets);
	});
});
