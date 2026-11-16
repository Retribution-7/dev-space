import { describe, expect, it } from "bun:test";

import type { RequestCollection } from "./request-collections";
import {
	normalizeStoredRequestCollections,
	parseRequestCollectionsPersistedState,
} from "./request-collections-persistence";

const validCollection: RequestCollection = {
	id: "collection-1",
	name: "DevSpace API",
	description: "Reusable requests",
	createdAt: "2026-11-16T10:00:00.000Z",
	updatedAt: "2026-11-16T10:05:00.000Z",
	requests: [
		{
			id: "request-1",
			name: "Create user",
			draft: {
				method: "POST",
				url: "https://api.example.com/users?page=2",
				params: [{ id: "param-1", key: "page", value: "2" }],
				headers: [{ id: "header-1", key: "Accept", value: "application/json" }],
				bodyType: "json",
				body: '{"name":"DevSpace"}',
			},
			createdAt: "2026-11-16T10:01:00.000Z",
			updatedAt: "2026-11-16T10:01:00.000Z",
		},
	],
};

describe("normalizeStoredRequestCollections", () => {
	it("normalizes a valid stored collection", () => {
		expect(normalizeStoredRequestCollections([validCollection])).toEqual([
			validCollection,
		]);
	});

	it("drops broken collections and duplicate ids", () => {
		expect(
			normalizeStoredRequestCollections([
				validCollection,
				{ ...validCollection, id: "collection-1", name: "Duplicate" },
				{ ...validCollection, id: "collection-2", name: "   " },
				{ ...validCollection, id: "collection-3", requests: "broken" },
				"garbage",
			]).map((collection) => collection.id),
		).toEqual(["collection-1", "collection-3"]);
	});

	it("drops broken saved requests but keeps the collection", () => {
		const normalized = normalizeStoredRequestCollections([
			{
				...validCollection,
				requests: [
					validCollection.requests[0],
					{
						...validCollection.requests[0],
						id: "request-1",
						name: "Duplicate",
					},
					{ ...validCollection.requests[0], id: "request-2", draft: {} },
					"garbage",
				],
			},
		]);

		expect(normalized[0].requests.map((request) => request.id)).toEqual([
			"request-1",
		]);
	});

	it("redacts sensitive request data while normalizing", () => {
		const normalized = normalizeStoredRequestCollections([
			{
				...validCollection,
				requests: [
					{
						...validCollection.requests[0],
						draft: {
							...validCollection.requests[0].draft,
							headers: [
								{
									id: "header-auth",
									key: "Authorization",
									value: "Bearer secret",
								},
							],
						},
					},
				],
			},
		]);

		expect(normalized[0].requests[0].draft.headers[0].value).toBe("[redacted]");
	});

	it("returns an empty list for anything that is not an array", () => {
		expect(normalizeStoredRequestCollections(undefined)).toEqual([]);
		expect(normalizeStoredRequestCollections("broken")).toEqual([]);
		expect(normalizeStoredRequestCollections({ collections: [] })).toEqual([]);
	});
});

describe("parseRequestCollectionsPersistedState", () => {
	it("tolerates wrapped, bare, and invalid storage shapes", () => {
		expect(parseRequestCollectionsPersistedState([validCollection])).toEqual({
			collections: [validCollection],
		});
		expect(
			parseRequestCollectionsPersistedState({ collections: [validCollection] }),
		).toEqual({ collections: [validCollection] });
		expect(
			parseRequestCollectionsPersistedState({
				state: { collections: [validCollection] },
			}),
		).toEqual({ collections: [validCollection] });
		expect(parseRequestCollectionsPersistedState("broken")).toEqual({
			collections: [],
		});
	});
});
