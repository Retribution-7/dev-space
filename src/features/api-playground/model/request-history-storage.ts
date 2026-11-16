import type { PersistStorage } from "zustand/middleware";

import {
	parseRequestHistoryPersistedState,
	REQUEST_HISTORY_STORAGE_VERSION,
	type RequestHistoryPersistedState,
} from "./request-history-persistence";

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getDefaultStorage(): KeyValueStorage | null {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		return window.localStorage;
	} catch {
		// Access can be denied by the browser configuration.
		return null;
	}
}

/**
 * Creates a resilient `zustand/persist` storage adapter for request history.
 *
 * - reading never throws: missing or corrupted data is treated as empty;
 * - writes before the first read are skipped, so an empty initial state can
 *   never overwrite persisted data before hydration completes;
 * - write errors (quota, private mode) are swallowed instead of crashing.
 */
export function createRequestHistoryStorage(
	getStorage: () => KeyValueStorage | null = getDefaultStorage,
): PersistStorage<RequestHistoryPersistedState> {
	let hasReadAttempted = false;

	return {
		getItem(name) {
			hasReadAttempted = true;

			const storage = getStorage();

			if (!storage) {
				return null;
			}

			try {
				const raw = storage.getItem(name);

				if (raw === null) {
					return null;
				}

				let parsed: unknown;

				try {
					parsed = JSON.parse(raw);
				} catch {
					return null;
				}

				return {
					state: parseRequestHistoryPersistedState(parsed),
					version: REQUEST_HISTORY_STORAGE_VERSION,
				};
			} catch {
				return null;
			}
		},

		setItem(name, value) {
			if (!hasReadAttempted) {
				return;
			}

			const storage = getStorage();

			if (!storage) {
				return;
			}

			try {
				storage.setItem(
					name,
					JSON.stringify({
						state: { entries: value.state.entries },
						version: value.version ?? REQUEST_HISTORY_STORAGE_VERSION,
					}),
				);
			} catch {
				// Persisted writes must never break the app.
			}
		},

		removeItem(name) {
			const storage = getStorage();

			if (!storage) {
				return;
			}

			try {
				storage.removeItem(name);
			} catch {
				// Ignore storage failures.
			}
		},
	};
}

export const requestHistoryStorage = createRequestHistoryStorage();
