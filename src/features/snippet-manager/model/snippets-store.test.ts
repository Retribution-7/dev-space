import { describe, expect, it } from "bun:test";

import {
	SNIPPETS_STORAGE_KEY,
	SNIPPETS_STORAGE_VERSION,
} from "./snippets-persistence";
import { createSnippetsStorage } from "./snippets-storage";
import { createSnippetsStore } from "./snippets-store";
import type { Snippet, SnippetDraft } from "./types";

type MemoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function createMemoryStorage(initial?: Record<string, string>) {
	const data = new Map<string, string>(Object.entries(initial ?? {}));

	const storage: MemoryStorage = {
		getItem: (name) => data.get(name) ?? null,
		setItem: (name, value) => {
			data.set(name, value);
		},
		removeItem: (name) => {
			data.delete(name);
		},
	};

	return { storage, data };
}

function createTestStore(initial?: Record<string, string>) {
	const memory = createMemoryStorage(initial);

	return {
		...memory,
		store: createSnippetsStore(createSnippetsStorage(() => memory.storage)),
	};
}

function makeDraft(overrides: Partial<SnippetDraft> = {}): SnippetDraft {
	return {
		title: "Debounce hook",
		description: "Delays updates.",
		code: "const value = 1;",
		language: "TypeScript",
		tags: ["react"],
		...overrides,
	};
}

function makeStoredSnippet(overrides: Partial<Snippet> = {}): string {
	return JSON.stringify({
		state: {
			snippets: [
				{
					id: "snippet-1",
					title: "Debounce hook",
					description: "",
					code: "const value = 1;",
					language: "TypeScript",
					tags: [],
					createdAt: "2026-01-01T09:00:00.000Z",
					updatedAt: "2026-01-02T09:00:00.000Z",
					...overrides,
				},
			],
		},
		version: SNIPPETS_STORAGE_VERSION,
	});
}

describe("snippets store", () => {
	it("restores saved snippets and reports hydration", () => {
		const { store } = createTestStore({
			[SNIPPETS_STORAGE_KEY]: makeStoredSnippet(),
		});

		expect(store.getState().hasHydrated).toBe(true);
		expect(store.getState().snippets).toHaveLength(1);
		expect(store.getState().snippets[0].id).toBe("snippet-1");
	});

	it("keeps persisted data when stored entries are partially broken", () => {
		const { store } = createTestStore({
			[SNIPPETS_STORAGE_KEY]: JSON.stringify({
				state: {
					snippets: [
						{ id: "", title: "Broken", code: "code" },
						"garbage",
						{ id: "snippet-2", title: "Valid", code: "code" },
					],
				},
				version: SNIPPETS_STORAGE_VERSION,
			}),
		});

		expect(store.getState().snippets.map((snippet) => snippet.id)).toEqual([
			"snippet-2",
		]);
	});

	it("does not crash on corrupted stored data", () => {
		const { store } = createTestStore({
			[SNIPPETS_STORAGE_KEY]: "{corrupt",
		});

		expect(store.getState().snippets).toEqual([]);
	});

	it("creates a snippet with a unique id and timestamps", () => {
		const { store } = createTestStore();
		const first = store.getState().createSnippet(makeDraft());
		const second = store.getState().createSnippet(makeDraft());

		expect(first.id).not.toBe(second.id);
		expect(first.createdAt).toBe(first.updatedAt);
		expect(store.getState().snippets.map((snippet) => snippet.id)).toEqual([
			second.id,
			first.id,
		]);
	});

	it("rejects snippets without a title or code", () => {
		const { store } = createTestStore();

		expect(() =>
			store.getState().createSnippet(makeDraft({ title: "   " })),
		).toThrow("Title is required.");
		expect(() =>
			store.getState().createSnippet(makeDraft({ code: "" })),
		).toThrow("Code is required.");
		expect(store.getState().snippets).toEqual([]);
	});

	it("returns the created snippet for follow-up work", () => {
		const { store } = createTestStore();
		const snippet = store.getState().createSnippet(makeDraft());

		expect(snippet.title).toBe("Debounce hook");
	});

	it("updates a snippet while preserving id and createdAt", () => {
		const { store } = createTestStore();
		const created = store.getState().createSnippet(makeDraft());
		const updated = store
			.getState()
			.updateSnippet(created.id, makeDraft({ title: "Improved hook" }));

		expect(updated.id).toBe(created.id);
		expect(updated.createdAt).toBe(created.createdAt);
		expect(updated.updatedAt >= created.updatedAt).toBe(true);
		expect(store.getState().snippets[0].title).toBe("Improved hook");
		expect(store.getState().snippets).toHaveLength(1);
	});

	it("throws when updating a snippet that does not exist", () => {
		const { store } = createTestStore();

		expect(() =>
			store.getState().updateSnippet("missing", makeDraft()),
		).toThrow("Snippet not found.");
	});

	it("deletes a snippet, including the last one", () => {
		const { store } = createTestStore();
		const created = store.getState().createSnippet(makeDraft());

		store.getState().deleteSnippet(created.id);

		expect(store.getState().snippets).toEqual([]);
	});

	it("persists created snippets to storage", () => {
		const { store, data } = createTestStore();
		const created = store.getState().createSnippet(makeDraft());

		const stored = JSON.parse(data.get(SNIPPETS_STORAGE_KEY) ?? "null");

		expect(stored.state.snippets.map((snippet: Snippet) => snippet.id)).toEqual(
			[created.id],
		);
	});

	it("keeps saved data intact when a store starts with persisted state", () => {
		const saved = makeStoredSnippet();
		const { data } = createTestStore({ [SNIPPETS_STORAGE_KEY]: saved });

		expect(
			JSON.parse(data.get(SNIPPETS_STORAGE_KEY) ?? "null").state.snippets,
		).toHaveLength(1);
	});

	it("adds and removes favorites without touching timestamps", () => {
		const { store } = createTestStore();
		const created = store.getState().createSnippet(makeDraft());

		const favorite = store.getState().setSnippetFavorite(created.id, true);

		expect(favorite.isFavorite).toBe(true);
		expect(favorite.updatedAt).toBe(created.updatedAt);
		expect(favorite.createdAt).toBe(created.createdAt);
		expect(store.getState().snippets[0].isFavorite).toBe(true);

		store.getState().setSnippetFavorite(created.id, false);

		expect(store.getState().snippets[0].isFavorite).toBe(false);
	});

	it("throws when favoriting a snippet that does not exist", () => {
		const { store } = createTestStore();

		expect(() => store.getState().setSnippetFavorite("missing", true)).toThrow(
			"Snippet not found.",
		);
	});

	it("persists favorites and restores them after reload", () => {
		const { store, data } = createTestStore();
		const created = store.getState().createSnippet(makeDraft());

		store.getState().setSnippetFavorite(created.id, true);

		const savedValue = data.get(SNIPPETS_STORAGE_KEY) ?? "";
		expect(JSON.parse(savedValue).state.snippets[0].isFavorite).toBe(true);

		const { store: restored } = createTestStore({
			[SNIPPETS_STORAGE_KEY]: savedValue,
		});

		expect(restored.getState().snippets[0].isFavorite).toBe(true);
	});

	it("treats snippets stored without the favorite flag as regular ones", () => {
		const { store } = createTestStore({
			[SNIPPETS_STORAGE_KEY]: makeStoredSnippet(),
		});

		expect(store.getState().snippets[0].isFavorite).toBe(false);
	});

	it("restores the favorite flag from storage", () => {
		const { store } = createTestStore({
			[SNIPPETS_STORAGE_KEY]: makeStoredSnippet({ isFavorite: true }),
		});

		expect(store.getState().snippets[0].isFavorite).toBe(true);
	});
});
