import type {
	CollectionSavedRequest,
	RequestCollection,
} from "./request-collections";
import {
	isStoredRecord,
	normalizeStoredRequestDraft,
} from "./request-draft-persistence";
import { sanitizeRequestDraftForPersistence } from "./request-history-redaction";

export const REQUEST_COLLECTIONS_STORAGE_KEY =
	"devspace:api-playground:collections";
export const REQUEST_COLLECTIONS_STORAGE_VERSION = 1;

export type RequestCollectionsPersistedState = {
	collections: RequestCollection[];
};

const FALLBACK_TIMESTAMP = "1970-01-01T00:00:00.000Z";

function normalizeStoredDate(value: unknown, fallback: string): string {
	if (typeof value === "string" && !Number.isNaN(new Date(value).getTime())) {
		return value;
	}

	return fallback;
}

function normalizeStoredCollectionRequest(
	value: unknown,
): CollectionSavedRequest | null {
	if (!isStoredRecord(value)) {
		return null;
	}

	if (typeof value.id !== "string" || value.id.trim() === "") {
		return null;
	}

	if (typeof value.name !== "string" || value.name.trim() === "") {
		return null;
	}

	const draft = normalizeStoredRequestDraft(value.draft);

	if (!draft) {
		return null;
	}

	const createdAt = normalizeStoredDate(value.createdAt, FALLBACK_TIMESTAMP);

	return {
		id: value.id,
		name: value.name.trim(),
		draft: sanitizeRequestDraftForPersistence(draft),
		createdAt,
		updatedAt: normalizeStoredDate(value.updatedAt, createdAt),
	};
}

function normalizeStoredRequestCollection(
	value: unknown,
): RequestCollection | null {
	if (!isStoredRecord(value)) {
		return null;
	}

	if (typeof value.id !== "string" || value.id.trim() === "") {
		return null;
	}

	if (typeof value.name !== "string" || value.name.trim() === "") {
		return null;
	}

	const requests: CollectionSavedRequest[] = [];
	const seenRequestIds = new Set<string>();

	if (Array.isArray(value.requests)) {
		for (const item of value.requests) {
			const request = normalizeStoredCollectionRequest(item);

			if (request && !seenRequestIds.has(request.id)) {
				seenRequestIds.add(request.id);
				requests.push(request);
			}
		}
	}

	const createdAt = normalizeStoredDate(value.createdAt, FALLBACK_TIMESTAMP);

	return {
		id: value.id,
		name: value.name.trim(),
		description:
			typeof value.description === "string" ? value.description.trim() : "",
		createdAt,
		updatedAt: normalizeStoredDate(value.updatedAt, createdAt),
		requests,
	};
}

/**
 * Validates stored collections, dropping broken collections and duplicate ids.
 * Anything that is not an array is treated as an empty collection list.
 */
export function normalizeStoredRequestCollections(
	value: unknown,
): RequestCollection[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const collections: RequestCollection[] = [];
	const seenIds = new Set<string>();

	for (const item of value) {
		const collection = normalizeStoredRequestCollection(item);

		if (collection && !seenIds.has(collection.id)) {
			seenIds.add(collection.id);
			collections.push(collection);
		}
	}

	return collections;
}

/**
 * Extracts a valid persisted state from arbitrary parsed storage data.
 * Tolerates `{ state: { collections } }`, `{ collections }`, and bare arrays.
 */
export function parseRequestCollectionsPersistedState(
	raw: unknown,
): RequestCollectionsPersistedState {
	if (Array.isArray(raw)) {
		return { collections: normalizeStoredRequestCollections(raw) };
	}

	if (isStoredRecord(raw)) {
		if (isStoredRecord(raw.state)) {
			return {
				collections: normalizeStoredRequestCollections(raw.state.collections),
			};
		}

		return { collections: normalizeStoredRequestCollections(raw.collections) };
	}

	return { collections: [] };
}
