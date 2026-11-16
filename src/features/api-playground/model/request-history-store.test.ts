import { describe, expect, it } from "bun:test";

import {
	createRequestHistoryEntry,
	REQUEST_HISTORY_LIMIT,
	type RequestHistoryEntry,
} from "./request-history";
import {
	REQUEST_HISTORY_STORAGE_KEY,
	type RequestHistoryPersistedState,
} from "./request-history-persistence";
import { createRequestHistoryStorage } from "./request-history-storage";
import { createRequestHistoryStore } from "./request-history-store";
import type { RequestDraft, RequestExecution } from "./types";

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

function createDraft(): RequestDraft {
	return {
		method: "GET",
		url: "https://api.example.com/users",
		params: [],
		headers: [],
		bodyType: "none",
		body: "",
	};
}

function createEntry(
	id: string,
	overrides: Partial<RequestHistoryEntry> = {},
): RequestHistoryEntry {
	return {
		id,
		executedAt: "2026-11-16T10:00:00.000Z",
		draft: createDraft(),
		result: {
			outcome: "success",
			statusCode: 200,
			statusText: "OK",
			durationMs: 42,
			sizeBytes: 11,
		},
		...overrides,
	};
}

describe("createRequestHistoryStore", () => {
	it("adds new entries at the beginning and enforces the limit", () => {
		const { storage } = createMemoryStorage();
		const store = createRequestHistoryStore(
			createRequestHistoryStorage(() => storage),
		);

		for (let index = 0; index < REQUEST_HISTORY_LIMIT + 3; index += 1) {
			store.getState().addEntry(createEntry(`entry-${index}`));
		}

		const entries = store.getState().entries;

		expect(entries).toHaveLength(REQUEST_HISTORY_LIMIT);
		expect(entries[0].id).toBe(`entry-${REQUEST_HISTORY_LIMIT + 2}`);
	});

	it("does not duplicate entries with the same id", () => {
		const { storage } = createMemoryStorage();
		const store = createRequestHistoryStore(
			createRequestHistoryStorage(() => storage),
		);

		store.getState().addEntry(createEntry("entry-1"));
		store.getState().addEntry(createEntry("entry-1"));

		expect(store.getState().entries).toHaveLength(1);
	});

	it("removes and clears history entries", () => {
		const { storage } = createMemoryStorage();
		const store = createRequestHistoryStore(
			createRequestHistoryStorage(() => storage),
		);

		store.getState().addEntry(createEntry("entry-1"));
		store.getState().addEntry(createEntry("entry-2"));
		store.getState().removeEntry("entry-1");

		expect(store.getState().entries.map((entry) => entry.id)).toEqual([
			"entry-2",
		]);

		store.getState().clearHistory();

		expect(store.getState().entries).toEqual([]);
	});

	it("persists sanitized entries so secrets are not written to storage", () => {
		const { storage, data } = createMemoryStorage();
		const store = createRequestHistoryStore(
			createRequestHistoryStorage(() => storage),
		);
		const execution: RequestExecution = {
			status: "network-error",
			message: "The request could not reach the server.",
			hints: [],
		};

		store.getState().addEntry(
			createRequestHistoryEntry(
				{
					method: "GET",
					url: "https://api.example.com/users",
					params: [],
					headers: [
						{ id: "header-1", key: "Authorization", value: "Bearer secret" },
					],
					bodyType: "none",
					body: "",
				},
				execution,
				{
					id: "entry-secret",
					executedAt: "2026-11-16T10:00:00.000Z",
					durationMs: 10,
				},
			),
		);

		const raw = data.get(REQUEST_HISTORY_STORAGE_KEY) ?? "";

		expect(raw).toContain("[redacted]");
		expect(raw).not.toContain("Bearer secret");
	});

	it("restores persisted entries after rehydration", () => {
		const { storage } = createMemoryStorage({
			[REQUEST_HISTORY_STORAGE_KEY]: JSON.stringify({
				state: {
					entries: [createEntry("entry-restored")],
				},
				version: 1,
			}),
		});

		const store = createRequestHistoryStore(
			createRequestHistoryStorage(() => storage),
		);

		expect(store.getState().entries.map((entry) => entry.id)).toEqual([
			"entry-restored",
		]);
	});
});

describe("RequestHistoryPersistedState", () => {
	it("is the shape written by the store", () => {
		const state: RequestHistoryPersistedState = {
			entries: [createEntry("entry-shape")],
		};

		expect(state.entries).toHaveLength(1);
	});
});
