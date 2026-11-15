import { describe, expect, it } from "bun:test";

import {
	normalizeStoredSnippet,
	normalizeStoredSnippets,
	parseSnippetsPersistedState,
} from "./snippets-persistence";

const validSnippet = {
	id: "snippet-1",
	title: "  Debounce hook  ",
	description: "  Delays updates.  ",
	code: "const value = 1;",
	language: "  TypeScript  ",
	tags: [" react ", "", "react", "hooks", 42],
	createdAt: "2026-01-01T09:00:00.000Z",
	updatedAt: "2026-01-02T09:00:00.000Z",
};

describe("normalizeStoredSnippet", () => {
	it("normalizes a valid stored snippet", () => {
		expect(normalizeStoredSnippet(validSnippet)).toEqual({
			id: "snippet-1",
			title: "Debounce hook",
			description: "Delays updates.",
			code: "const value = 1;",
			language: "TypeScript",
			tags: ["react", "hooks"],
			createdAt: "2026-01-01T09:00:00.000Z",
			updatedAt: "2026-01-02T09:00:00.000Z",
		});
	});

	it("fills missing optional fields with safe defaults", () => {
		expect(
			normalizeStoredSnippet({
				id: "snippet-1",
				title: "Title",
				code: "code",
			}),
		).toEqual({
			id: "snippet-1",
			title: "Title",
			description: "",
			code: "code",
			language: "Text",
			tags: [],
			createdAt: "1970-01-01T00:00:00.000Z",
			updatedAt: "1970-01-01T00:00:00.000Z",
		});
	});

	it("falls back to createdAt when updatedAt is broken", () => {
		expect(
			normalizeStoredSnippet({
				...validSnippet,
				updatedAt: "not-a-date",
			})?.updatedAt,
		).toBe("2026-01-01T09:00:00.000Z");
	});

	it("drops entries without a usable id, title, or code", () => {
		expect(normalizeStoredSnippet(null)).toBeNull();
		expect(normalizeStoredSnippet("snippet")).toBeNull();
		expect(normalizeStoredSnippet({ ...validSnippet, id: " " })).toBeNull();
		expect(normalizeStoredSnippet({ ...validSnippet, title: "" })).toBeNull();
		expect(normalizeStoredSnippet({ ...validSnippet, code: "   " })).toBeNull();
	});
});

describe("normalizeStoredSnippets", () => {
	it("returns an empty list for anything that is not an array", () => {
		expect(normalizeStoredSnippets(undefined)).toEqual([]);
		expect(normalizeStoredSnippets(null)).toEqual([]);
		expect(normalizeStoredSnippets("broken")).toEqual([]);
		expect(normalizeStoredSnippets({ snippets: [] })).toEqual([]);
	});

	it("keeps valid entries, drops broken ones, and removes duplicate ids", () => {
		expect(
			normalizeStoredSnippets([
				validSnippet,
				{ id: "snippet-1", title: "Duplicate", code: "code" },
				{ id: "snippet-2", title: "", code: "code" },
				"garbage",
				{ id: "snippet-3", title: "Kept", code: "code" },
			]),
		).toHaveLength(2);
	});
});

const expectedSnippet = {
	id: "snippet-1",
	title: "Debounce hook",
	description: "Delays updates.",
	code: "const value = 1;",
	language: "TypeScript",
	tags: ["react", "hooks"],
	createdAt: "2026-01-01T09:00:00.000Z",
	updatedAt: "2026-01-02T09:00:00.000Z",
};

describe("parseSnippetsPersistedState", () => {
	it("reads a wrapped persisted payload", () => {
		expect(
			parseSnippetsPersistedState({
				state: { snippets: [validSnippet] },
				version: 1,
			}),
		).toEqual({ snippets: [expectedSnippet] });
	});

	it("reads a bare snippets payload", () => {
		expect(parseSnippetsPersistedState({ snippets: [validSnippet] })).toEqual({
			snippets: [expectedSnippet],
		});
	});

	it("reads a bare array", () => {
		expect(parseSnippetsPersistedState([validSnippet])).toEqual({
			snippets: [expectedSnippet],
		});
	});

	it("treats unknown structures as empty", () => {
		expect(parseSnippetsPersistedState(undefined)).toEqual({ snippets: [] });
		expect(parseSnippetsPersistedState("corrupt")).toEqual({ snippets: [] });
		expect(parseSnippetsPersistedState(42)).toEqual({ snippets: [] });
	});
});
