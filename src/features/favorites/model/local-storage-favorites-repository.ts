import { isToolId, type ToolId } from "@/shared/config/tools";

import type { FavoritesRepository } from "./types";

const STORAGE_KEY = "devspace:favorite-tools";

function normalizeFavoriteIds(values: unknown[]): ToolId[] {
	const validIds = values.filter(
		(value): value is ToolId => typeof value === "string" && isToolId(value),
	);

	return [...new Set(validIds)];
}

function parseStoredFavoriteIds(storedValue: string): ToolId[] {
	try {
		const parsedValue: unknown = JSON.parse(storedValue);

		if (!Array.isArray(parsedValue)) {
			return [];
		}

		return normalizeFavoriteIds(parsedValue);
	} catch {
		// Malformed stored data is treated as empty; storage access errors still propagate.
		return [];
	}
}

function readStoredFavoriteIds(): ToolId[] {
	if (typeof window === "undefined") {
		return [];
	}

	const storedValue = window.localStorage.getItem(STORAGE_KEY);

	if (!storedValue) {
		return [];
	}

	return parseStoredFavoriteIds(storedValue);
}

function writeStoredFavoriteIds(toolIds: ToolId[]) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify(normalizeFavoriteIds(toolIds)),
	);
}

export const favoritesRepository: FavoritesRepository = {
	async getFavoriteToolIds() {
		return readStoredFavoriteIds();
	},

	async setFavoriteToolIds(toolIds) {
		writeStoredFavoriteIds(toolIds);
	},
};
