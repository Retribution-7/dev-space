"use client";

import { useSyncExternalStore } from "react";

import { useRequestHistoryStore } from "./request-history-store";

/**
 * Reads the persisted API Playground request history and its actions.
 */
export function useRequestHistory() {
	const entries = useRequestHistoryStore((state) => state.entries);
	const addEntry = useRequestHistoryStore((state) => state.addEntry);
	const removeEntry = useRequestHistoryStore((state) => state.removeEntry);
	const clearHistory = useRequestHistoryStore((state) => state.clearHistory);

	return { entries, addEntry, removeEntry, clearHistory };
}

/**
 * Returns `true` once persisted history is loaded.
 *
 * The server snapshot is always `false`, so SSR and the hydration render
 * produce identical markup and never flash the empty state.
 */
export function useRequestHistoryHydration(): boolean {
	return useSyncExternalStore(
		useRequestHistoryStore.subscribe,
		() => useRequestHistoryStore.getState().hasHydrated,
		() => false,
	);
}
