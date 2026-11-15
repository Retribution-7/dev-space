import { describe, expect, it } from "bun:test";

import {
	SNIPPETS_STORAGE_KEY,
	SNIPPETS_STORAGE_VERSION,
} from "./snippets-persistence";
import { createSnippetsStorage } from "./snippets-storage";

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

const savedValue = JSON.stringify({
	state: {
		snippets: [
			{
				id: "snippet-1",
				title: "Debounce hook",
				description: "",
				code: "const value = 1;",
				language: "TypeScript",
				tags: ["react"],
				createdAt: "2026-01-01T09:00:00.000Z",
				updatedAt: "2026-01-02T09:00:00.000Z",
			},
		],
	},
	version: 1,
});

describe("createSnippetsStorage", () => {
	it("returns null when nothing is stored", () => {
		const { storage } = createMemoryStorage();

		expect(
			createSnippetsStorage(() => storage).getItem(SNIPPETS_STORAGE_KEY),
		).toBeNull();
	});

	it("returns null for corrupted JSON instead of throwing", () => {
		const { storage } = createMemoryStorage({
			[SNIPPETS_STORAGE_KEY]: "{not valid json",
		});

		expect(
			createSnippetsStorage(() => storage).getItem(SNIPPETS_STORAGE_KEY),
		).toBeNull();
	});

	it("restores and normalizes stored snippets", () => {
		const { storage } = createMemoryStorage({
			[SNIPPETS_STORAGE_KEY]: savedValue,
		});

		expect(
			createSnippetsStorage(() => storage).getItem(SNIPPETS_STORAGE_KEY),
		).toEqual({
			state: {
				snippets: [
					{
						id: "snippet-1",
						title: "Debounce hook",
						description: "",
						code: "const value = 1;",
						language: "TypeScript",
						tags: ["react"],
						createdAt: "2026-01-01T09:00:00.000Z",
						updatedAt: "2026-01-02T09:00:00.000Z",
					},
				],
			},
			version: SNIPPETS_STORAGE_VERSION,
		});
	});

	it("never writes before the first read, protecting saved data", () => {
		const { storage, data } = createMemoryStorage({
			[SNIPPETS_STORAGE_KEY]: savedValue,
		});
		const persistStorage = createSnippetsStorage(() => storage);

		persistStorage.setItem(SNIPPETS_STORAGE_KEY, {
			state: { snippets: [] },
			version: SNIPPETS_STORAGE_VERSION,
		});

		expect(data.get(SNIPPETS_STORAGE_KEY)).toBe(savedValue);
	});

	it("writes after the first read", () => {
		const { storage, data } = createMemoryStorage();
		const persistStorage = createSnippetsStorage(() => storage);

		persistStorage.getItem(SNIPPETS_STORAGE_KEY);
		persistStorage.setItem(SNIPPETS_STORAGE_KEY, {
			state: { snippets: [] },
			version: SNIPPETS_STORAGE_VERSION,
		});

		expect(JSON.parse(data.get(SNIPPETS_STORAGE_KEY) ?? "null")).toEqual({
			state: { snippets: [] },
			version: SNIPPETS_STORAGE_VERSION,
		});
	});

	it("survives a storage that throws", () => {
		const throwingStorage: MemoryStorage = {
			getItem() {
				throw new Error("Access denied");
			},
			setItem() {
				throw new Error("Quota exceeded");
			},
			removeItem() {
				throw new Error("Access denied");
			},
		};
		const persistStorage = createSnippetsStorage(() => throwingStorage);

		expect(persistStorage.getItem(SNIPPETS_STORAGE_KEY)).toBeNull();
		expect(() =>
			persistStorage.setItem(SNIPPETS_STORAGE_KEY, {
				state: { snippets: [] },
				version: SNIPPETS_STORAGE_VERSION,
			}),
		).not.toThrow();
		expect(() => persistStorage.removeItem(SNIPPETS_STORAGE_KEY)).not.toThrow();
	});

	it("works without any storage available", () => {
		const persistStorage = createSnippetsStorage(() => null);

		expect(persistStorage.getItem(SNIPPETS_STORAGE_KEY)).toBeNull();
		expect(() =>
			persistStorage.setItem(SNIPPETS_STORAGE_KEY, {
				state: { snippets: [] },
				version: SNIPPETS_STORAGE_VERSION,
			}),
		).not.toThrow();
	});
});
