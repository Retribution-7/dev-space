"use client";

import { useSyncExternalStore } from "react";

import {
	RECENT_SNIPPETS_LIMIT,
	selectRecentSnippets,
} from "./snippets-selectors";
import { useSnippetsStore } from "./snippets-store";
import type { Snippet } from "./types";

/**
 * Reads the shared snippets collection and its CRUD actions.
 */
export function useSnippets() {
	const snippets = useSnippetsStore((state) => state.snippets);
	const createSnippet = useSnippetsStore((state) => state.createSnippet);
	const updateSnippet = useSnippetsStore((state) => state.updateSnippet);
	const setSnippetFavorite = useSnippetsStore(
		(state) => state.setSnippetFavorite,
	);
	const deleteSnippet = useSnippetsStore((state) => state.deleteSnippet);
	const importSnippets = useSnippetsStore((state) => state.importSnippets);

	return {
		snippets,
		createSnippet,
		updateSnippet,
		setSnippetFavorite,
		deleteSnippet,
		importSnippets,
	};
}

/**
 * Returns `true` once persisted snippets are loaded.
 *
 * The server snapshot is always `false`, so SSR and the hydration render
 * produce identical markup and never flash the empty state.
 */
export function useSnippetsHydration(): boolean {
	return useSyncExternalStore(
		useSnippetsStore.subscribe,
		() => useSnippetsStore.getState().hasHydrated,
		() => false,
	);
}

export function useRecentSnippets(
	limit: number = RECENT_SNIPPETS_LIMIT,
): Snippet[] {
	const snippets = useSnippetsStore((state) => state.snippets);

	return selectRecentSnippets(snippets, limit);
}
