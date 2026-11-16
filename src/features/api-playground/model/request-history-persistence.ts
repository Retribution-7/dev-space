import {
	isStoredRecord,
	normalizeStoredRequestDraft,
} from "./request-draft-persistence";
import {
	REQUEST_HISTORY_LIMIT,
	type RequestHistoryEntry,
	type RequestHistoryOutcome,
	type RequestHistoryResult,
} from "./request-history";
import { sanitizeHistoryEntryForPersistence } from "./request-history-redaction";

export const REQUEST_HISTORY_STORAGE_KEY = "devspace:api-playground:history";
export const REQUEST_HISTORY_STORAGE_VERSION = 1;

export type RequestHistoryPersistedState = {
	entries: RequestHistoryEntry[];
};

const FALLBACK_TIMESTAMP = "1970-01-01T00:00:00.000Z";

const REQUEST_HISTORY_OUTCOMES: RequestHistoryOutcome[] = [
	"success",
	"http-error",
	"network-error",
	"timeout",
	"canceled",
	"unexpected-error",
];

function normalizeStoredDate(value: unknown, fallback: string): string {
	if (typeof value === "string" && !Number.isNaN(new Date(value).getTime())) {
		return value;
	}

	return fallback;
}

function normalizeStoredResult(value: unknown): RequestHistoryResult | null {
	if (!isStoredRecord(value)) {
		return null;
	}

	const outcome = REQUEST_HISTORY_OUTCOMES.find(
		(item) => item === value.outcome,
	);

	if (!outcome) {
		return null;
	}

	const durationMs =
		typeof value.durationMs === "number" && Number.isFinite(value.durationMs)
			? Math.max(0, value.durationMs)
			: 0;

	return {
		outcome,
		statusCode:
			typeof value.statusCode === "number" && Number.isInteger(value.statusCode)
				? value.statusCode
				: undefined,
		statusText:
			typeof value.statusText === "string" ? value.statusText : undefined,
		durationMs,
		sizeBytes:
			typeof value.sizeBytes === "number" && Number.isFinite(value.sizeBytes)
				? Math.max(0, value.sizeBytes)
				: undefined,
		message: typeof value.message === "string" ? value.message : undefined,
		code: typeof value.code === "string" ? value.code : undefined,
		timeoutMs:
			typeof value.timeoutMs === "number" && Number.isFinite(value.timeoutMs)
				? Math.max(0, value.timeoutMs)
				: undefined,
	};
}

/**
 * Validates and normalizes one stored history entry. Broken entries are
 * dropped so a single bad record cannot corrupt the whole history.
 */
export function normalizeStoredHistoryEntry(
	value: unknown,
): RequestHistoryEntry | null {
	if (!isStoredRecord(value)) {
		return null;
	}

	if (typeof value.id !== "string" || value.id.trim() === "") {
		return null;
	}

	const draft = normalizeStoredRequestDraft(value.draft);

	if (!draft) {
		return null;
	}

	const result = normalizeStoredResult(value.result);

	if (!result) {
		return null;
	}

	return sanitizeHistoryEntryForPersistence({
		id: value.id,
		executedAt: normalizeStoredDate(value.executedAt, FALLBACK_TIMESTAMP),
		draft,
		result,
	});
}

/**
 * Validates stored history entries, dropping broken records and duplicate ids.
 * Anything that is not an array is treated as an empty history.
 */
export function normalizeStoredHistoryEntries(
	value: unknown,
): RequestHistoryEntry[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const entries: RequestHistoryEntry[] = [];
	const seenIds = new Set<string>();

	for (const item of value) {
		const entry = normalizeStoredHistoryEntry(item);

		if (entry && !seenIds.has(entry.id)) {
			seenIds.add(entry.id);
			entries.push(entry);
		}
	}

	return entries.slice(0, REQUEST_HISTORY_LIMIT);
}

/**
 * Extracts a valid persisted state from arbitrary parsed storage data.
 * Tolerates `{ state: { entries } }`, `{ entries }`, and bare arrays.
 */
export function parseRequestHistoryPersistedState(
	raw: unknown,
): RequestHistoryPersistedState {
	if (Array.isArray(raw)) {
		return { entries: normalizeStoredHistoryEntries(raw) };
	}

	if (isStoredRecord(raw)) {
		if (isStoredRecord(raw.state)) {
			return { entries: normalizeStoredHistoryEntries(raw.state.entries) };
		}

		return { entries: normalizeStoredHistoryEntries(raw.entries) };
	}

	return { entries: [] };
}
