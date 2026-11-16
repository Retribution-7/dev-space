import { describe, expect, it } from "bun:test";

import {
	REQUEST_HISTORY_STORAGE_KEY,
	REQUEST_HISTORY_STORAGE_VERSION,
} from "./request-history-persistence";
import { createRequestHistoryStorage } from "./request-history-storage";

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
		entries: [
			{
				id: "entry-1",
				executedAt: "2026-11-16T10:00:00.000Z",
				draft: {
					method: "GET",
					url: "https://api.example.com/users",
					params: [],
					headers: [],
					bodyType: "none",
					body: "",
				},
				result: {
					outcome: "success",
					statusCode: 200,
					statusText: "OK",
					durationMs: 42,
					sizeBytes: 11,
				},
			},
		],
	},
	version: 1,
});

describe("createRequestHistoryStorage", () => {
	it("returns null when nothing is stored", () => {
		const { storage } = createMemoryStorage();

		expect(
			createRequestHistoryStorage(() => storage).getItem(
				REQUEST_HISTORY_STORAGE_KEY,
			),
		).toBeNull();
	});

	it("returns null for corrupted JSON instead of throwing", () => {
		const { storage } = createMemoryStorage({
			[REQUEST_HISTORY_STORAGE_KEY]: "{not valid json",
		});

		expect(
			createRequestHistoryStorage(() => storage).getItem(
				REQUEST_HISTORY_STORAGE_KEY,
			),
		).toBeNull();
	});

	it("restores and normalizes stored history entries", () => {
		const { storage } = createMemoryStorage({
			[REQUEST_HISTORY_STORAGE_KEY]: savedValue,
		});

		expect(
			createRequestHistoryStorage(() => storage).getItem(
				REQUEST_HISTORY_STORAGE_KEY,
			),
		).toEqual({
			state: {
				entries: [
					{
						id: "entry-1",
						executedAt: "2026-11-16T10:00:00.000Z",
						draft: {
							method: "GET",
							url: "https://api.example.com/users",
							params: [],
							headers: [],
							bodyType: "none",
							body: "",
						},
						result: {
							outcome: "success",
							statusCode: 200,
							statusText: "OK",
							durationMs: 42,
							sizeBytes: 11,
						},
					},
				],
			},
			version: REQUEST_HISTORY_STORAGE_VERSION,
		});
	});

	it("never writes before the first read, protecting saved data", () => {
		const { storage, data } = createMemoryStorage({
			[REQUEST_HISTORY_STORAGE_KEY]: savedValue,
		});
		const persistStorage = createRequestHistoryStorage(() => storage);

		persistStorage.setItem(REQUEST_HISTORY_STORAGE_KEY, {
			state: { entries: [] },
			version: REQUEST_HISTORY_STORAGE_VERSION,
		});

		expect(data.get(REQUEST_HISTORY_STORAGE_KEY)).toBe(savedValue);
	});

	it("writes after the first read", () => {
		const { storage, data } = createMemoryStorage();
		const persistStorage = createRequestHistoryStorage(() => storage);

		persistStorage.getItem(REQUEST_HISTORY_STORAGE_KEY);
		persistStorage.setItem(REQUEST_HISTORY_STORAGE_KEY, {
			state: { entries: [] },
			version: REQUEST_HISTORY_STORAGE_VERSION,
		});

		expect(JSON.parse(data.get(REQUEST_HISTORY_STORAGE_KEY) ?? "null")).toEqual(
			{
				state: { entries: [] },
				version: REQUEST_HISTORY_STORAGE_VERSION,
			},
		);
	});

	it("swallows storage write errors", () => {
		const storage: MemoryStorage = {
			getItem: () => null,
			setItem: () => {
				throw new Error("Quota exceeded");
			},
			removeItem: () => {},
		};
		const persistStorage = createRequestHistoryStorage(() => storage);

		persistStorage.getItem(REQUEST_HISTORY_STORAGE_KEY);

		expect(() =>
			persistStorage.setItem(REQUEST_HISTORY_STORAGE_KEY, {
				state: { entries: [] },
				version: REQUEST_HISTORY_STORAGE_VERSION,
			}),
		).not.toThrow();
	});
});
