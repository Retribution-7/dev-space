import { cloneRequestDraft, toKeyValueEntries } from "./request-draft";
import type { RequestDraft, RequestExecution } from "./types";

export const REQUEST_HISTORY_LIMIT = 100;

export type RequestHistoryOutcome = RequestExecution["status"];

export type RequestHistoryResult = {
	outcome: RequestHistoryOutcome;
	statusCode?: number;
	statusText?: string;
	durationMs: number;
	sizeBytes?: number;
	message?: string;
	code?: string;
	timeoutMs?: number;
};

export type RequestHistoryEntry = {
	id: string;
	executedAt: string;
	draft: RequestDraft;
	result: RequestHistoryResult;
};

export type CreateRequestHistoryEntryOptions = {
	id: string;
	executedAt: string;
	durationMs: number;
};

export function createRequestHistoryEntry(
	draft: RequestDraft,
	execution: RequestExecution,
	{ id, executedAt, durationMs }: CreateRequestHistoryEntryOptions,
): RequestHistoryEntry {
	return {
		id,
		executedAt,
		draft: createHistoryDraft(draft),
		result: createHistoryResult(execution, durationMs),
	};
}

export function toRequestDraft(entry: RequestHistoryEntry): RequestDraft {
	return cloneRequestDraft(entry.draft);
}

export function prependRequestHistoryEntry(
	entries: RequestHistoryEntry[],
	entry: RequestHistoryEntry,
	limit: number = REQUEST_HISTORY_LIMIT,
): RequestHistoryEntry[] {
	return [entry, ...entries.filter((item) => item.id !== entry.id)].slice(
		0,
		limit,
	);
}

export function removeRequestHistoryEntry(
	entries: RequestHistoryEntry[],
	id: string,
): RequestHistoryEntry[] {
	return entries.filter((entry) => entry.id !== id);
}

export function clearRequestHistory(): RequestHistoryEntry[] {
	return [];
}

function createHistoryDraft(draft: RequestDraft): RequestDraft {
	const params = toKeyValueEntries(draft.params).map((entry, index) => ({
		id: `param-${index}`,
		key: entry.key,
		value: entry.value,
	}));
	const headers = toKeyValueEntries(draft.headers).map((entry, index) => ({
		id: `header-${index}`,
		key: entry.key,
		value: entry.value,
	}));

	return {
		method: draft.method,
		url: draft.url,
		params,
		headers,
		bodyType: draft.bodyType,
		body: draft.body,
	};
}

function createHistoryResult(
	execution: RequestExecution,
	durationMs: number,
): RequestHistoryResult {
	switch (execution.status) {
		case "success":
			return {
				outcome: execution.status,
				statusCode: execution.response.status,
				statusText: execution.response.statusText,
				durationMs: execution.response.durationMs,
				sizeBytes: execution.response.sizeBytes,
			};
		case "http-error":
			return {
				outcome: execution.status,
				statusCode: execution.response.status,
				statusText: execution.response.statusText,
				durationMs: execution.response.durationMs,
				sizeBytes: execution.response.sizeBytes,
			};
		case "network-error":
			return {
				outcome: execution.status,
				durationMs,
				message: execution.message,
				code: execution.code,
			};
		case "timeout":
			return {
				outcome: execution.status,
				durationMs,
				message: execution.message,
				timeoutMs: execution.timeoutMs,
			};
		case "canceled":
			return {
				outcome: execution.status,
				durationMs,
			};
		case "unexpected-error":
			return {
				outcome: execution.status,
				durationMs,
				message: execution.message,
				code: execution.code,
			};
	}
}
