import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

import { normalizeSnippetDraft } from "./snippet-draft";
import {
	createSnippet as createSnippetRecord,
	removeSnippet,
	updateSnippet as updateSnippetRecord,
} from "./snippet-operations";
import { validateSnippetDraft } from "./snippet-validation";
import {
	parseSnippetsPersistedState,
	SNIPPETS_STORAGE_KEY,
	SNIPPETS_STORAGE_VERSION,
	type SnippetsPersistedState,
} from "./snippets-persistence";
import { snippetsStorage } from "./snippets-storage";
import type { Snippet, SnippetDraft } from "./types";

export type SnippetsState = {
	snippets: Snippet[];
	hasHydrated: boolean;
	setHasHydrated: (hasHydrated: boolean) => void;
	createSnippet: (draft: SnippetDraft) => Snippet;
	updateSnippet: (id: string, draft: SnippetDraft) => Snippet;
	deleteSnippet: (id: string) => void;
};

function normalizeAndValidate(draft: SnippetDraft): SnippetDraft {
	const normalized = normalizeSnippetDraft(draft);
	const errors = validateSnippetDraft(normalized);

	if (errors.title) {
		throw new Error(errors.title);
	}

	if (errors.code) {
		throw new Error(errors.code);
	}

	return normalized;
}

export function createSnippetsStore(
	storage: PersistStorage<SnippetsPersistedState>,
) {
	return create<SnippetsState>()(
		persist(
			(set, get) => ({
				snippets: [],
				hasHydrated: false,

				setHasHydrated(hasHydrated) {
					set({ hasHydrated });
				},

				createSnippet(draft) {
					const snippet = createSnippetRecord(normalizeAndValidate(draft), {
						id: crypto.randomUUID(),
						timestamp: new Date().toISOString(),
					});

					set((state) => ({ snippets: [snippet, ...state.snippets] }));

					return snippet;
				},

				updateSnippet(id, draft) {
					const current = get().snippets.find((snippet) => snippet.id === id);

					if (!current) {
						throw new Error("Snippet not found.");
					}

					const snippet = updateSnippetRecord(
						current,
						normalizeAndValidate(draft),
						new Date().toISOString(),
					);

					set((state) => ({
						snippets: state.snippets.map((item) =>
							item.id === id ? snippet : item,
						),
					}));

					return snippet;
				},

				deleteSnippet(id) {
					set((state) => ({ snippets: removeSnippet(state.snippets, id) }));
				},
			}),
			{
				name: SNIPPETS_STORAGE_KEY,
				version: SNIPPETS_STORAGE_VERSION,
				storage,
				partialize: (state) => ({ snippets: state.snippets }),
				merge: (persisted, current) => ({
					...current,
					snippets: parseSnippetsPersistedState(persisted).snippets,
				}),
				onRehydrateStorage: () => (state) => {
					state?.setHasHydrated(true);
				},
			},
		),
	);
}

export const useSnippetsStore = createSnippetsStore(snippetsStorage);
