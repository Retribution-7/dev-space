"use client";

import { useSyncExternalStore } from "react";

import { useRequestCollectionsStore } from "./request-collections-store";

/**
 * Reads the persisted API Playground collections and their actions.
 */
export function useRequestCollections() {
	const collections = useRequestCollectionsStore((state) => state.collections);
	const createCollection = useRequestCollectionsStore(
		(state) => state.createCollection,
	);
	const updateCollection = useRequestCollectionsStore(
		(state) => state.updateCollection,
	);
	const deleteCollection = useRequestCollectionsStore(
		(state) => state.deleteCollection,
	);
	const saveRequest = useRequestCollectionsStore((state) => state.saveRequest);
	const renameRequest = useRequestCollectionsStore(
		(state) => state.renameRequest,
	);
	const deleteRequest = useRequestCollectionsStore(
		(state) => state.deleteRequest,
	);

	return {
		collections,
		createCollection,
		updateCollection,
		deleteCollection,
		saveRequest,
		renameRequest,
		deleteRequest,
	};
}

/**
 * Returns `true` once persisted collections are loaded.
 *
 * The server snapshot is always `false`, so SSR and the hydration render
 * produce identical markup and never flash the empty state.
 */
export function useRequestCollectionsHydration(): boolean {
	return useSyncExternalStore(
		useRequestCollectionsStore.subscribe,
		() => useRequestCollectionsStore.getState().hasHydrated,
		() => false,
	);
}
