import { DEFAULT_SNIPPET_LANGUAGE, normalizeTags } from "./snippet-draft";
import type { Snippet } from "./types";

export const SNIPPETS_STORAGE_KEY = "devspace:snippets";
export const SNIPPETS_STORAGE_VERSION = 1;

export type SnippetsPersistedState = {
	snippets: Snippet[];
};

const FALLBACK_TIMESTAMP = "1970-01-01T00:00:00.000Z";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStoredDate(value: unknown, fallback: string): string {
	if (typeof value === "string" && !Number.isNaN(new Date(value).getTime())) {
		return value;
	}

	return fallback;
}

/**
 * Validates and normalizes a single stored snippet entry.
 * Entries that violate core business rules (missing identity, title, or code)
 * are dropped by returning `null`.
 */
export function normalizeStoredSnippet(value: unknown): Snippet | null {
	if (!isRecord(value)) {
		return null;
	}

	if (typeof value.id !== "string" || value.id.trim() === "") {
		return null;
	}

	if (typeof value.title !== "string" || value.title.trim() === "") {
		return null;
	}

	if (typeof value.code !== "string" || value.code.trim() === "") {
		return null;
	}

	const createdAt = normalizeStoredDate(value.createdAt, FALLBACK_TIMESTAMP);

	return {
		id: value.id,
		title: value.title.trim(),
		description:
			typeof value.description === "string" ? value.description.trim() : "",
		code: value.code,
		language:
			typeof value.language === "string" && value.language.trim() !== ""
				? value.language.trim()
				: DEFAULT_SNIPPET_LANGUAGE,
		tags: normalizeTags(
			Array.isArray(value.tags)
				? value.tags.filter((tag): tag is string => typeof tag === "string")
				: [],
		),
		createdAt,
		updatedAt: normalizeStoredDate(value.updatedAt, createdAt),
	};
}

/**
 * Validates and normalizes stored snippets, dropping broken entries and
 * duplicate ids. Anything that is not an array is treated as empty.
 */
export function normalizeStoredSnippets(value: unknown): Snippet[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const snippets: Snippet[] = [];
	const seenIds = new Set<string>();

	for (const entry of value) {
		const snippet = normalizeStoredSnippet(entry);

		if (snippet && !seenIds.has(snippet.id)) {
			seenIds.add(snippet.id);
			snippets.push(snippet);
		}
	}

	return snippets;
}

/**
 * Extracts a valid persisted state from arbitrary parsed storage data.
 * Tolerates `{ state: { snippets } }`, `{ snippets }`, and bare arrays.
 */
export function parseSnippetsPersistedState(
	raw: unknown,
): SnippetsPersistedState {
	if (Array.isArray(raw)) {
		return { snippets: normalizeStoredSnippets(raw) };
	}

	if (isRecord(raw)) {
		if (isRecord(raw.state)) {
			return { snippets: normalizeStoredSnippets(raw.state.snippets) };
		}

		return { snippets: normalizeStoredSnippets(raw.snippets) };
	}

	return { snippets: [] };
}
