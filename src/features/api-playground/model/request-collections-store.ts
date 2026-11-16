import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

import {
	addRequestToCollection,
	COLLECTION_NOT_FOUND_MESSAGE,
	type CollectionSavedRequest,
	createCollectionRequest,
	createRequestCollection,
	removeRequestCollection,
	removeRequestFromCollection,
	renameCollectionRequest,
	REQUEST_NAME_REQUIRED_MESSAGE,
	REQUEST_NOT_FOUND_MESSAGE,
	type RequestCollection,
	updateRequestCollection,
} from "./request-collections";
import {
	parseRequestCollectionsPersistedState,
	REQUEST_COLLECTIONS_STORAGE_KEY,
	REQUEST_COLLECTIONS_STORAGE_VERSION,
	type RequestCollectionsPersistedState,
} from "./request-collections-persistence";
import { requestCollectionsStorage } from "./request-collections-storage";
import { sanitizeRequestDraftForPersistence } from "./request-history-redaction";
import type { RequestDraft } from "./types";

export type RequestCollectionsState = {
	collections: RequestCollection[];
	hasHydrated: boolean;
	setHasHydrated: (hasHydrated: boolean) => void;
	createCollection: (input: {
		name: string;
		description?: string;
	}) => RequestCollection;
	updateCollection: (
		id: string,
		changes: { name: string; description: string },
	) => RequestCollection;
	deleteCollection: (id: string) => void;
	saveRequest: (
		collectionId: string,
		input: { name: string; draft: RequestDraft },
	) => CollectionSavedRequest;
	renameRequest: (
		collectionId: string,
		requestId: string,
		name: string,
	) => void;
	deleteRequest: (collectionId: string, requestId: string) => void;
};

function sanitizeCollectionForPersistence(
	collection: RequestCollection,
): RequestCollection {
	return {
		...collection,
		requests: collection.requests.map((request) => ({
			...request,
			draft: sanitizeRequestDraftForPersistence(request.draft),
		})),
	};
}

function findCollection(
	collections: RequestCollection[],
	id: string,
): RequestCollection {
	const collection = collections.find((item) => item.id === id);

	if (!collection) {
		throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
	}

	return collection;
}

export function createRequestCollectionsStore(
	storage: PersistStorage<RequestCollectionsPersistedState>,
) {
	return create<RequestCollectionsState>()(
		persist(
			(set, get) => ({
				collections: [],
				hasHydrated: false,

				setHasHydrated(hasHydrated) {
					set({ hasHydrated });
				},

				createCollection({ name, description = "" }) {
					const collection = createRequestCollection({
						id: crypto.randomUUID(),
						name,
						description,
					});

					set((state) => ({
						collections: [collection, ...state.collections],
					}));

					return collection;
				},

				updateCollection(id, changes) {
					const collection = findCollection(get().collections, id);
					const updated = updateRequestCollection(
						collection,
						changes,
						new Date().toISOString(),
					);

					set((state) => ({
						collections: state.collections.map((item) =>
							item.id === id ? updated : item,
						),
					}));

					return updated;
				},

				deleteCollection(id) {
					set((state) => ({
						collections: removeRequestCollection(state.collections, id),
					}));
				},

				saveRequest(collectionId, { name, draft }) {
					if (name.trim() === "") {
						throw new Error(REQUEST_NAME_REQUIRED_MESSAGE);
					}

					findCollection(get().collections, collectionId);
					const request = createCollectionRequest({
						id: crypto.randomUUID(),
						name,
						draft,
					});

					set((state) => ({
						collections: state.collections.map((item) =>
							item.id === collectionId
								? addRequestToCollection(
										item,
										request,
										new Date().toISOString(),
									)
								: item,
						),
					}));

					return request;
				},

				renameRequest(collectionId, requestId, name) {
					const collection = findCollection(get().collections, collectionId);

					if (
						!collection.requests.some((request) => request.id === requestId)
					) {
						throw new Error(REQUEST_NOT_FOUND_MESSAGE);
					}

					set((state) => ({
						collections: state.collections.map((item) =>
							item.id === collectionId
								? renameCollectionRequest(
										item,
										requestId,
										name,
										new Date().toISOString(),
									)
								: item,
						),
					}));
				},

				deleteRequest(collectionId, requestId) {
					const collection = findCollection(get().collections, collectionId);

					if (
						!collection.requests.some((request) => request.id === requestId)
					) {
						return;
					}

					set((state) => ({
						collections: state.collections.map((item) =>
							item.id === collectionId
								? removeRequestFromCollection(
										item,
										requestId,
										new Date().toISOString(),
									)
								: item,
						),
					}));
				},
			}),
			{
				name: REQUEST_COLLECTIONS_STORAGE_KEY,
				version: REQUEST_COLLECTIONS_STORAGE_VERSION,
				storage,
				partialize: (state) => ({
					collections: state.collections.map(sanitizeCollectionForPersistence),
				}),
				merge: (persisted, current) => ({
					...current,
					collections:
						parseRequestCollectionsPersistedState(persisted).collections,
				}),
				onRehydrateStorage: () => (state) => {
					state?.setHasHydrated(true);
				},
			},
		),
	);
}

export const useRequestCollectionsStore = createRequestCollectionsStore(
	requestCollectionsStorage,
);
