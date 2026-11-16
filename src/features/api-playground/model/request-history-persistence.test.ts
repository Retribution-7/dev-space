import { describe, expect, it } from "bun:test";

import {
	REQUEST_HISTORY_LIMIT,
	type RequestHistoryEntry,
} from "./request-history";
import {
	normalizeStoredHistoryEntries,
	normalizeStoredHistoryEntry,
	parseRequestHistoryPersistedState,
} from "./request-history-persistence";

const validEntry: RequestHistoryEntry = {
	id: "entry-1",
	executedAt: "2026-11-16T10:00:00.000Z",
	draft: {
		method: "POST",
		url: "https://api.example.com/users?page=2",
		params: [{ id: "param-1", key: "page", value: "2" }],
		headers: [{ id: "header-1", key: "Accept", value: "application/json" }],
		bodyType: "json",
		body: '{"name":"DevSpace"}',
	},
	result: {
		outcome: "success",
		statusCode: 200,
		statusText: "OK",
		durationMs: 42,
		sizeBytes: 11,
	},
};

describe("normalizeStoredHistoryEntry", () => {
	it("normalizes a valid stored entry", () => {
		expect(normalizeStoredHistoryEntry(validEntry)).toEqual(validEntry);
	});

	it("drops entries without a usable id, draft, or result", () => {
		expect(normalizeStoredHistoryEntry(null)).toBeNull();
		expect(normalizeStoredHistoryEntry("entry")).toBeNull();
		expect(normalizeStoredHistoryEntry({ ...validEntry, id: " " })).toBeNull();
		expect(
			normalizeStoredHistoryEntry({ ...validEntry, draft: {} }),
		).toBeNull();
		expect(
			normalizeStoredHistoryEntry({
				...validEntry,
				result: { outcome: "nope" },
			}),
		).toBeNull();
	});

	it("drops drafts with an unsupported method or missing URL", () => {
		expect(
			normalizeStoredHistoryEntry({
				...validEntry,
				draft: { ...validEntry.draft, method: "FETCH" },
			}),
		).toBeNull();
		expect(
			normalizeStoredHistoryEntry({
				...validEntry,
				draft: { ...validEntry.draft, url: "" },
			}),
		).toBeNull();
	});

	it("normalizes rows and fills safe defaults", () => {
		const entry = normalizeStoredHistoryEntry({
			id: "entry-defaults",
			executedAt: "not-a-date",
			draft: {
				method: "GET",
				url: "https://api.example.com/users",
				params: [{ key: "page", value: "2" }, "garbage"],
				headers: [],
				bodyType: "unknown",
			},
			result: {
				outcome: "canceled",
				durationMs: -5,
			},
		});

		expect(entry).toEqual({
			id: "entry-defaults",
			executedAt: "1970-01-01T00:00:00.000Z",
			draft: {
				method: "GET",
				url: "https://api.example.com/users",
				params: [{ id: "param-0", key: "page", value: "2" }],
				headers: [],
				bodyType: "none",
				body: "",
			},
			result: {
				outcome: "canceled",
				statusCode: undefined,
				statusText: undefined,
				durationMs: 0,
				sizeBytes: undefined,
				message: undefined,
				code: undefined,
				timeoutMs: undefined,
			},
		});
	});

	it("redacts sensitive data while normalizing", () => {
		const entry = normalizeStoredHistoryEntry({
			...validEntry,
			draft: {
				...validEntry.draft,
				headers: [
					{ id: "header-auth", key: "Authorization", value: "Bearer secret" },
				],
			},
		});

		expect(entry?.draft.headers[0].value).toBe("[redacted]");
	});
});

describe("normalizeStoredHistoryEntries", () => {
	it("returns an empty list for anything that is not an array", () => {
		expect(normalizeStoredHistoryEntries(undefined)).toEqual([]);
		expect(normalizeStoredHistoryEntries(null)).toEqual([]);
		expect(normalizeStoredHistoryEntries("broken")).toEqual([]);
		expect(normalizeStoredHistoryEntries({ entries: [] })).toEqual([]);
	});

	it("drops broken entries and duplicate ids", () => {
		expect(
			normalizeStoredHistoryEntries([
				validEntry,
				{
					...validEntry,
					id: "entry-1",
					executedAt: "2026-11-16T11:00:00.000Z",
				},
				{ ...validEntry, id: "entry-2", draft: {} },
				"garbage",
			]).map((entry) => entry.id),
		).toEqual(["entry-1"]);
	});

	it("caps the number of stored entries", () => {
		const entries = Array.from(
			{ length: REQUEST_HISTORY_LIMIT + 5 },
			(_, index) => ({
				...validEntry,
				id: `entry-${index}`,
			}),
		);

		expect(normalizeStoredHistoryEntries(entries)).toHaveLength(
			REQUEST_HISTORY_LIMIT,
		);
	});
});

describe("parseRequestHistoryPersistedState", () => {
	it("tolerates wrapped, bare, and invalid storage shapes", () => {
		expect(parseRequestHistoryPersistedState([validEntry])).toEqual({
			entries: [validEntry],
		});
		expect(
			parseRequestHistoryPersistedState({ entries: [validEntry] }),
		).toEqual({
			entries: [validEntry],
		});
		expect(
			parseRequestHistoryPersistedState({ state: { entries: [validEntry] } }),
		).toEqual({ entries: [validEntry] });
		expect(parseRequestHistoryPersistedState("broken")).toEqual({
			entries: [],
		});
	});
});
