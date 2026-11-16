import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

import {
	clearRequestHistory,
	prependRequestHistoryEntry,
	removeRequestHistoryEntry,
	type RequestHistoryEntry,
} from "./request-history";
import {
	parseRequestHistoryPersistedState,
	REQUEST_HISTORY_STORAGE_KEY,
	REQUEST_HISTORY_STORAGE_VERSION,
	type RequestHistoryPersistedState,
} from "./request-history-persistence";
import { sanitizeHistoryEntryForPersistence } from "./request-history-redaction";
import { requestHistoryStorage } from "./request-history-storage";

export type RequestHistoryState = {
	entries: RequestHistoryEntry[];
	hasHydrated: boolean;
	setHasHydrated: (hasHydrated: boolean) => void;
	addEntry: (entry: RequestHistoryEntry) => void;
	removeEntry: (id: string) => void;
	clearHistory: () => void;
};

export function createRequestHistoryStore(
	storage: PersistStorage<RequestHistoryPersistedState>,
) {
	return create<RequestHistoryState>()(
		persist(
			(set) => ({
				entries: [],
				hasHydrated: false,

				setHasHydrated(hasHydrated) {
					set({ hasHydrated });
				},

				addEntry(entry) {
					set((state) => ({
						entries: prependRequestHistoryEntry(state.entries, entry),
					}));
				},

				removeEntry(id) {
					set((state) => ({
						entries: removeRequestHistoryEntry(state.entries, id),
					}));
				},

				clearHistory() {
					set({ entries: clearRequestHistory() });
				},
			}),
			{
				name: REQUEST_HISTORY_STORAGE_KEY,
				version: REQUEST_HISTORY_STORAGE_VERSION,
				storage,
				partialize: (state) => ({
					entries: state.entries.map(sanitizeHistoryEntryForPersistence),
				}),
				merge: (persisted, current) => ({
					...current,
					entries: parseRequestHistoryPersistedState(persisted).entries,
				}),
				onRehydrateStorage: () => (state) => {
					state?.setHasHydrated(true);
				},
			},
		),
	);
}

export const useRequestHistoryStore = createRequestHistoryStore(
	requestHistoryStorage,
);
