import { describe, expect, it } from "bun:test";

import { createRequestDraft } from "./request-draft";
import {
	clearRequestHistory,
	createRequestHistoryEntry,
	prependRequestHistoryEntry,
	removeRequestHistoryEntry,
	REQUEST_HISTORY_LIMIT,
	type RequestHistoryEntry,
	toRequestDraft,
} from "./request-history";
import type { HttpResponse, RequestDraft, RequestExecution } from "./types";

function createDraft(overrides: Partial<RequestDraft> = {}): RequestDraft {
	return {
		...createRequestDraft(),
		method: "POST",
		url: "https://api.example.com/users",
		params: [
			{ id: "param-1", key: "page", value: "2" },
			{ id: "param-empty", key: "", value: "ignored" },
		],
		headers: [
			{ id: "header-1", key: "Accept", value: "application/json" },
			{ id: "header-empty", key: "  ", value: "ignored" },
		],
		bodyType: "json",
		body: '{"name":"DevSpace"}',
		...overrides,
	};
}

function createResponse(overrides: Partial<HttpResponse> = {}): HttpResponse {
	return {
		status: 200,
		statusText: "OK",
		headers: {},
		body: '{"ok":true}',
		durationMs: 42,
		sizeBytes: 11,
		...overrides,
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

describe("createRequestHistoryEntry", () => {
	it("stores the request configuration and successful result", () => {
		const execution: RequestExecution = {
			status: "success",
			response: createResponse(),
		};
		const entry = createRequestHistoryEntry(createDraft(), execution, {
			id: "entry-1",
			executedAt: "2026-11-16T10:00:00.000Z",
			durationMs: 50,
		});

		expect(entry.id).toBe("entry-1");
		expect(entry.executedAt).toBe("2026-11-16T10:00:00.000Z");
		expect(entry.draft.method).toBe("POST");
		expect(entry.draft.url).toBe("https://api.example.com/users");
		expect(entry.draft.params).toEqual([
			{ id: "param-0", key: "page", value: "2" },
		]);
		expect(entry.draft.headers).toEqual([
			{ id: "header-0", key: "Accept", value: "application/json" },
		]);
		expect(entry.draft.bodyType).toBe("json");
		expect(entry.draft.body).toBe('{"name":"DevSpace"}');
		expect(entry.result).toEqual({
			outcome: "success",
			statusCode: 200,
			statusText: "OK",
			durationMs: 42,
			sizeBytes: 11,
		});
	});

	it("stores HTTP errors with their status", () => {
		const entry = createRequestHistoryEntry(
			createDraft(),
			{
				status: "http-error",
				response: createResponse({
					status: 503,
					statusText: "Service Unavailable",
				}),
			},
			{
				id: "entry-http-error",
				executedAt: "2026-11-16T10:00:00.000Z",
				durationMs: 20,
			},
		);

		expect(entry.result.outcome).toBe("http-error");
		expect(entry.result.statusCode).toBe(503);
		expect(entry.result.statusText).toBe("Service Unavailable");
	});

	it("stores network errors, timeouts, cancellations, and unexpected errors", () => {
		const executions: RequestExecution[] = [
			{
				status: "network-error",
				message: "The request could not reach the server.",
				code: "ERR_NETWORK",
				hints: ["Check the URL."],
			},
			{
				status: "timeout",
				message: "The request timed out after 30 seconds.",
				timeoutMs: 30_000,
			},
			{ status: "canceled" },
			{
				status: "unexpected-error",
				message: "Something went wrong.",
				code: "ERR_BAD_OPTION",
			},
		];

		for (const [index, execution] of executions.entries()) {
			const entry = createRequestHistoryEntry(createDraft(), execution, {
				id: `entry-${index}`,
				executedAt: "2026-11-16T10:00:00.000Z",
				durationMs: 15,
			});

			expect(entry.result.outcome).toBe(execution.status);
			expect(entry.result.durationMs).toBe(15);
		}
	});
});

describe("toRequestDraft", () => {
	it("restores the request configuration", () => {
		const entry = createEntry("entry-restore");
		const draft = toRequestDraft(entry);

		expect(draft).toEqual(entry.draft);
	});

	it("returns a copy so history entries are not mutated", () => {
		const entry = createEntry("entry-copy");
		const draft = toRequestDraft(entry);

		draft.url = "https://changed.example.com";
		draft.params[0].value = "999";

		expect(entry.draft.url).toBe("https://api.example.com/users");
		expect(entry.draft.params[0].value).toBe("2");
	});
});

describe("prependRequestHistoryEntry", () => {
	it("adds new entries at the beginning", () => {
		const first = createEntry("entry-1");
		const second = createEntry("entry-2");

		let entries = prependRequestHistoryEntry([], first);
		entries = prependRequestHistoryEntry(entries, second);

		expect(entries.map((entry) => entry.id)).toEqual(["entry-2", "entry-1"]);
	});

	it("does not duplicate an entry with the same id", () => {
		const first = createEntry("entry-1");
		const updated = createEntry("entry-1", {
			result: {
				outcome: "timeout",
				durationMs: 30_000,
				message: "The request timed out after 30 seconds.",
			},
		});

		let entries = prependRequestHistoryEntry([], first);
		entries = prependRequestHistoryEntry(entries, updated);

		expect(entries).toHaveLength(1);
		expect(entries[0].result.outcome).toBe("timeout");
	});

	it("drops the oldest entries beyond the limit", () => {
		let entries: RequestHistoryEntry[] = [];

		for (let index = 0; index < REQUEST_HISTORY_LIMIT + 5; index += 1) {
			entries = prependRequestHistoryEntry(
				entries,
				createEntry(`entry-${index}`),
			);
		}

		expect(entries).toHaveLength(REQUEST_HISTORY_LIMIT);
		expect(entries[0].id).toBe(`entry-${REQUEST_HISTORY_LIMIT + 4}`);
		expect(entries.at(-1)?.id).toBe("entry-5");
	});
});

describe("removeRequestHistoryEntry and clearRequestHistory", () => {
	it("removes only the requested entry", () => {
		const entries = [
			createEntry("entry-1"),
			createEntry("entry-2"),
			createEntry("entry-3"),
		];

		expect(
			removeRequestHistoryEntry(entries, "entry-2").map((entry) => entry.id),
		).toEqual(["entry-1", "entry-3"]);
	});

	it("clears the whole history", () => {
		expect(clearRequestHistory()).toEqual([]);
	});
});
