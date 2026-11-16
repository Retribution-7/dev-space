import { describe, expect, it } from "bun:test";

import type { RequestCollection } from "./request-collections";
import {
	REQUEST_COLLECTIONS_STORAGE_KEY,
	REQUEST_COLLECTIONS_STORAGE_VERSION,
} from "./request-collections-persistence";
import { createRequestCollectionsStorage } from "./request-collections-storage";

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

const validCollection: RequestCollection = {
	id: "collection-1",
	name: "DevSpace API",
	description: "",
	createdAt: "2026-11-16T10:00:00.000Z",
	updatedAt: "2026-11-16T10:00:00.000Z",
	requests: [],
};

const savedValue = JSON.stringify({
	state: { collections: [validCollection] },
	version: 1,
});

describe("createRequestCollectionsStorage", () => {
	it("returns null when nothing is stored", () => {
		const { storage } = createMemoryStorage();

		expect(
			createRequestCollectionsStorage(() => storage).getItem(
				REQUEST_COLLECTIONS_STORAGE_KEY,
			),
		).toBeNull();
	});

	it("returns null for corrupted JSON instead of throwing", () => {
		const { storage } = createMemoryStorage({
			[REQUEST_COLLECTIONS_STORAGE_KEY]: "{not valid json",
		});

		expect(
			createRequestCollectionsStorage(() => storage).getItem(
				REQUEST_COLLECTIONS_STORAGE_KEY,
			),
		).toBeNull();
	});

	it("restores and normalizes stored collections", () => {
		const { storage } = createMemoryStorage({
			[REQUEST_COLLECTIONS_STORAGE_KEY]: savedValue,
		});

		expect(
			createRequestCollectionsStorage(() => storage).getItem(
				REQUEST_COLLECTIONS_STORAGE_KEY,
			),
		).toEqual({
			state: { collections: [validCollection] },
			version: REQUEST_COLLECTIONS_STORAGE_VERSION,
		});
	});

	it("never writes before the first read, protecting saved data", () => {
		const { storage, data } = createMemoryStorage({
			[REQUEST_COLLECTIONS_STORAGE_KEY]: savedValue,
		});
		const persistStorage = createRequestCollectionsStorage(() => storage);

		persistStorage.setItem(REQUEST_COLLECTIONS_STORAGE_KEY, {
			state: { collections: [] },
			version: REQUEST_COLLECTIONS_STORAGE_VERSION,
		});

		expect(data.get(REQUEST_COLLECTIONS_STORAGE_KEY)).toBe(savedValue);
	});

	it("writes after the first read", () => {
		const { storage, data } = createMemoryStorage();
		const persistStorage = createRequestCollectionsStorage(() => storage);

		persistStorage.getItem(REQUEST_COLLECTIONS_STORAGE_KEY);
		persistStorage.setItem(REQUEST_COLLECTIONS_STORAGE_KEY, {
			state: { collections: [] },
			version: REQUEST_COLLECTIONS_STORAGE_VERSION,
		});

		expect(
			JSON.parse(data.get(REQUEST_COLLECTIONS_STORAGE_KEY) ?? "null"),
		).toEqual({
			state: { collections: [] },
			version: REQUEST_COLLECTIONS_STORAGE_VERSION,
		});
	});

	it("swallows storage write errors", () => {
		const storage: MemoryStorage = {
			getItem: () => null,
			setItem: () => {
				throw new Error("Quota exceeded");
			},
			removeItem: () => {},
		};
		const persistStorage = createRequestCollectionsStorage(() => storage);

		persistStorage.getItem(REQUEST_COLLECTIONS_STORAGE_KEY);

		expect(() =>
			persistStorage.setItem(REQUEST_COLLECTIONS_STORAGE_KEY, {
				state: { collections: [] },
				version: REQUEST_COLLECTIONS_STORAGE_VERSION,
			}),
		).not.toThrow();
	});
});
