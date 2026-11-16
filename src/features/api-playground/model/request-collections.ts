import { cloneRequestDraft } from "./request-draft";
import type { RequestDraft } from "./types";

export type CollectionSavedRequest = {
	id: string;
	name: string;
	draft: RequestDraft;
	createdAt: string;
	updatedAt: string;
};

export type RequestCollection = {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	requests: CollectionSavedRequest[];
};

export type CreateRequestCollectionInput = {
	id: string;
	name: string;
	description?: string;
	createdAt?: string;
};

export type SaveCollectionRequestInput = {
	id: string;
	name: string;
	draft: RequestDraft;
	createdAt?: string;
};

export const COLLECTION_NAME_REQUIRED_MESSAGE = "Enter a collection name.";
export const REQUEST_NAME_REQUIRED_MESSAGE = "Enter a request name.";
export const COLLECTION_NOT_FOUND_MESSAGE = "Collection not found.";
export const REQUEST_NOT_FOUND_MESSAGE = "Request not found.";

export function createRequestCollection({
	id,
	name,
	description = "",
	createdAt = new Date().toISOString(),
}: CreateRequestCollectionInput): RequestCollection {
	const normalizedName = name.trim();

	if (normalizedName === "") {
		throw new Error(COLLECTION_NAME_REQUIRED_MESSAGE);
	}

	return {
		id,
		name: normalizedName,
		description: description.trim(),
		createdAt,
		updatedAt: createdAt,
		requests: [],
	};
}

export function updateRequestCollection(
	collection: RequestCollection,
	changes: { name: string; description: string },
	updatedAt: string,
): RequestCollection {
	const normalizedName = changes.name.trim();

	if (normalizedName === "") {
		throw new Error(COLLECTION_NAME_REQUIRED_MESSAGE);
	}

	return {
		...collection,
		name: normalizedName,
		description: changes.description.trim(),
		updatedAt,
	};
}

export function createCollectionRequest({
	id,
	name,
	draft,
	createdAt = new Date().toISOString(),
}: SaveCollectionRequestInput): CollectionSavedRequest {
	const normalizedName = name.trim();

	if (normalizedName === "") {
		throw new Error(REQUEST_NAME_REQUIRED_MESSAGE);
	}

	return {
		id,
		name: normalizedName,
		draft: cloneRequestDraft(draft),
		createdAt,
		updatedAt: createdAt,
	};
}

export function addRequestToCollection(
	collection: RequestCollection,
	request: CollectionSavedRequest,
	updatedAt: string,
): RequestCollection {
	return {
		...collection,
		updatedAt,
		requests: [
			request,
			...collection.requests.filter((item) => item.id !== request.id),
		],
	};
}

export function renameCollectionRequest(
	collection: RequestCollection,
	requestId: string,
	name: string,
	updatedAt: string,
): RequestCollection {
	const normalizedName = name.trim();

	if (normalizedName === "") {
		throw new Error(REQUEST_NAME_REQUIRED_MESSAGE);
	}

	return {
		...collection,
		updatedAt,
		requests: collection.requests.map((request) =>
			request.id === requestId
				? { ...request, name: normalizedName, updatedAt }
				: request,
		),
	};
}

export function removeRequestFromCollection(
	collection: RequestCollection,
	requestId: string,
	updatedAt: string,
): RequestCollection {
	return {
		...collection,
		updatedAt,
		requests: collection.requests.filter((request) => request.id !== requestId),
	};
}

export function removeRequestCollection(
	collections: RequestCollection[],
	id: string,
): RequestCollection[] {
	return collections.filter((collection) => collection.id !== id);
}

export function toCollectionRequestDraft(
	request: CollectionSavedRequest,
): RequestDraft {
	return cloneRequestDraft(request.draft);
}
