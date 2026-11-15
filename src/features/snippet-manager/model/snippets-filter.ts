import type { Snippet } from "./types";

export type SnippetsDateRange =
	| { type: "all" }
	| { type: "last-days"; days: number }
	| { type: "custom"; from: Date; to: Date };

export type SnippetsFilterState = {
	query: string;
	language: string | null;
	tags: string[];
	dateRange: SnippetsDateRange;
};

export const ALL_TIME_DATE_RANGE: SnippetsDateRange = { type: "all" };

export const EMPTY_SNIPPETS_FILTER: SnippetsFilterState = {
	query: "",
	language: null,
	tags: [],
	dateRange: ALL_TIME_DATE_RANGE,
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date: Date): Date {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate() + 1,
		0,
		0,
		0,
		-1,
	);
}

/**
 * Builds a custom date range from two calendar days.
 * Reversed input is swapped and both ends cover the whole day.
 */
export function createCustomDateRange(from: Date, to: Date): SnippetsDateRange {
	const [start, end] = from.getTime() <= to.getTime() ? [from, to] : [to, from];

	return { type: "custom", from: start, to: end };
}

function toTimestamp(value: string): number {
	const timestamp = new Date(value).getTime();

	return Number.isNaN(timestamp) ? 0 : timestamp;
}

function matchesQuery(snippet: Snippet, query: string): boolean {
	if (query === "") {
		return true;
	}

	return (
		snippet.title.toLowerCase().includes(query) ||
		snippet.description.toLowerCase().includes(query) ||
		snippet.code.toLowerCase().includes(query) ||
		snippet.language.toLowerCase().includes(query) ||
		snippet.tags.some((tag) => tag.toLowerCase().includes(query))
	);
}

function matchesLanguage(snippet: Snippet, language: string | null): boolean {
	if (language === null) {
		return true;
	}

	return (
		snippet.language.trim().toLowerCase() === language.trim().toLowerCase()
	);
}

function matchesTags(snippet: Snippet, tags: string[]): boolean {
	if (tags.length === 0) {
		return true;
	}

	const snippetTags = snippet.tags.map((tag) => tag.trim().toLowerCase());

	// Every selected tag must be present on the snippet (AND semantics).
	return tags.every((tag) => snippetTags.includes(tag.trim().toLowerCase()));
}

function matchesDate(
	snippet: Snippet,
	dateRange: SnippetsDateRange,
	now: number,
): boolean {
	const updated = toTimestamp(snippet.updatedAt);

	switch (dateRange.type) {
		case "all":
			return true;
		case "last-days":
			return updated >= now - dateRange.days * DAY_IN_MS;
		case "custom":
			return (
				updated >= startOfLocalDay(dateRange.from).getTime() &&
				updated <= endOfLocalDay(dateRange.to).getTime()
			);
	}
}

/**
 * Returns snippets matching the search query and all active filters.
 * The source collection is never mutated.
 */
export function filterSnippets(
	snippets: Snippet[],
	filter: SnippetsFilterState,
	now: number = Date.now(),
): Snippet[] {
	const query = filter.query.trim().toLowerCase();

	return snippets.filter(
		(snippet) =>
			matchesQuery(snippet, query) &&
			matchesLanguage(snippet, filter.language) &&
			matchesTags(snippet, filter.tags) &&
			matchesDate(snippet, filter.dateRange, now),
	);
}

function collectOptions(values: string[]): string[] {
	const options = new Map<string, string>();

	for (const value of values) {
		const option = value.trim();

		if (option !== "" && !options.has(option.toLowerCase())) {
			options.set(option.toLowerCase(), option);
		}
	}

	return [...options.values()].sort((first, second) =>
		first.toLowerCase().localeCompare(second.toLowerCase()),
	);
}

/** Languages used by the given snippets, for the language filter options. */
export function getAvailableLanguages(snippets: Snippet[]): string[] {
	return collectOptions(snippets.map((snippet) => snippet.language));
}

/** Tags used by the given snippets, for the tags filter options. */
export function getAvailableTags(snippets: Snippet[]): string[] {
	return collectOptions(snippets.flatMap((snippet) => snippet.tags));
}

/** Number of active filter groups: language, tags, and date range. */
export function countActiveFilters(filter: SnippetsFilterState): number {
	let count = 0;

	if (filter.language !== null) {
		count += 1;
	}

	if (filter.tags.length > 0) {
		count += 1;
	}

	if (filter.dateRange.type !== "all") {
		count += 1;
	}

	return count;
}

/** Whether the search query or any filter deviates from the defaults. */
export function isFilterActive(filter: SnippetsFilterState): boolean {
	return filter.query.trim() !== "" || countActiveFilters(filter) > 0;
}
