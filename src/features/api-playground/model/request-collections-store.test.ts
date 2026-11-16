import { describe, expect, it } from "bun:test";

import { REQUEST_COLLECTIONS_STORAGE_KEY } from "./request-collections-persistence";
import { createRequestCollectionsStorage } from "./request-collections-storage";
import { createRequestCollectionsStore } from "./request-collections-store";
import { createRequestHistoryEntry } from "./request-history";
import { createRequestHistoryStorage } from "./request-history-storage";
import { createRequestHistoryStore } from "./request-history-store";
import type { RequestDraft } from "./types";

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

function createDraft(overrides: Partial<RequestDraft> = {}): RequestDraft {
	return {
		method: "GET",
		url: "https://api.example.com/users",
		params: [],
		headers: [],
		bodyType: "none",
		body: "",
		...overrides,
	};
}

function createCollectionsStore(initial?: Record<string, string>) {
	const { storage, data } = createMemoryStorage(initial);
	const store = createRequestCollectionsStore(
		createRequestCollectionsStorage(() => storage),
	);

	return { store, data };
}

describe("createRequestCollectionsStore", () => {
	it("creates, updates, and deletes collections", () => {
		const { store } = createCollectionsStore();

		const collection = store.getState().createCollection({
			name: "DevSpace API",
			description: "Reusable requests",
		});

		expect(store.getState().collections).toEqual([collection]);

		const updated = store.getState().updateCollection(collection.id, {
			name: "Updated API",
			description: "Updated description",
		});

		expect(updated.name).toBe("Updated API");
		expect(store.getState().collections[0].description).toBe(
			"Updated description",
		);

		store.getState().deleteCollection(collection.id);

		expect(store.getState().collections).toEqual([]);
	});

	it("rejects blank collection names", () => {
		const { store } = createCollectionsStore();

		expect(() => store.getState().createCollection({ name: "  " })).toThrow(
			"Enter a collection name.",
		);
	});

	it("saves multiple requests to a collection and keeps the newest first", () => {
		const { store } = createCollectionsStore();
		const collection = store.getState().createCollection({ name: "API" });

		store.getState().saveRequest(collection.id, {
			name: "First",
			draft: createDraft({ url: "https://api.example.com/first" }),
		});
		store.getState().saveRequest(collection.id, {
			name: "Second",
			draft: createDraft({ url: "https://api.example.com/second" }),
		});

		expect(
			store.getState().collections[0].requests.map((request) => request.name),
		).toEqual(["Second", "First"]);
	});

	it("renames and deletes saved requests", () => {
		const { store } = createCollectionsStore();
		const collection = store.getState().createCollection({ name: "API" });
		const request = store.getState().saveRequest(collection.id, {
			name: "Original",
			draft: createDraft(),
		});

		store.getState().renameRequest(collection.id, request.id, "  Renamed  ");

		expect(store.getState().collections[0].requests[0].name).toBe("Renamed");

		store.getState().deleteRequest(collection.id, request.id);

		expect(store.getState().collections[0].requests).toEqual([]);
	});

	it("persists sanitized collections so secrets are not written to storage", () => {
		const { store, data } = createCollectionsStore();
		const collection = store.getState().createCollection({ name: "API" });

		store.getState().saveRequest(collection.id, {
			name: "With secret",
			draft: createDraft({
				headers: [
					{ id: "header-1", key: "Authorization", value: "Bearer secret" },
				],
			}),
		});

		const raw = data.get(REQUEST_COLLECTIONS_STORAGE_KEY) ?? "";

		expect(raw).toContain("[redacted]");
		expect(raw).not.toContain("Bearer secret");
	});

	it("restores persisted collections after rehydration", () => {
		const { store } = createCollectionsStore({
			[REQUEST_COLLECTIONS_STORAGE_KEY]: JSON.stringify({
				state: {
					collections: [
						{
							id: "collection-1",
							name: "Restored",
							description: "",
							createdAt: "2026-11-16T10:00:00.000Z",
							updatedAt: "2026-11-16T10:00:00.000Z",
							requests: [],
						},
					],
				},
				version: 1,
			}),
		});

		expect(
			store.getState().collections.map((collection) => collection.name),
		).toEqual(["Restored"]);
	});

	it("keeps collections and request history independent", () => {
		const { storage: collectionStorage } = createMemoryStorage();
		const { storage: historyStorage } = createMemoryStorage();
		const collectionsStore = createRequestCollectionsStore(
			createRequestCollectionsStorage(() => collectionStorage),
		);
		const historyStore = createRequestHistoryStore(
			createRequestHistoryStorage(() => historyStorage),
		);

		const firstCollection = collectionsStore.getState().createCollection({
			name: "First",
		});
		const secondCollection = collectionsStore.getState().createCollection({
			name: "Second",
		});

		for (const collection of [firstCollection, secondCollection]) {
			collectionsStore.getState().saveRequest(collection.id, {
				name: "Saved request",
				draft: createDraft(),
			});
		}

		historyStore.getState().addEntry(
			createRequestHistoryEntry(
				createDraft(),
				{ status: "canceled" },
				{
					id: "history-1",
					executedAt: "2026-11-16T10:00:00.000Z",
					durationMs: 5,
				},
			),
		);

		historyStore.getState().removeEntry("history-1");

		expect(
			collectionsStore
				.getState()
				.collections.map((collection) => collection.id),
		).toEqual([secondCollection.id, firstCollection.id]);

		historyStore.getState().addEntry(
			createRequestHistoryEntry(
				createDraft(),
				{ status: "canceled" },
				{
					id: "history-2",
					executedAt: "2026-11-16T10:01:00.000Z",
					durationMs: 5,
				},
			),
		);

		collectionsStore.getState().deleteCollection(firstCollection.id);

		expect(historyStore.getState().entries.map((entry) => entry.id)).toEqual([
			"history-2",
		]);
		expect(
			collectionsStore
				.getState()
				.collections.map((collection) => collection.id),
		).toEqual([secondCollection.id]);
	});
});
