import { describe, expect, it } from "bun:test";

import {
	addRequestToCollection,
	COLLECTION_NAME_REQUIRED_MESSAGE,
	type CollectionSavedRequest,
	createCollectionRequest,
	createRequestCollection,
	removeRequestCollection,
	removeRequestFromCollection,
	renameCollectionRequest,
	REQUEST_NAME_REQUIRED_MESSAGE,
	type RequestCollection,
	toCollectionRequestDraft,
	updateRequestCollection,
} from "./request-collections";
import type { RequestDraft } from "./types";

function createDraft(): RequestDraft {
	return {
		method: "POST",
		url: "https://api.example.com/users",
		params: [{ id: "param-1", key: "page", value: "2" }],
		headers: [{ id: "header-1", key: "Accept", value: "application/json" }],
		bodyType: "json",
		body: '{"name":"DevSpace"}',
	};
}

function createCollection(): RequestCollection {
	return createRequestCollection({
		id: "collection-1",
		name: "DevSpace API",
		description: "Reusable requests",
		createdAt: "2026-11-16T10:00:00.000Z",
	});
}

function createSavedRequest(
	id: string,
	overrides: Partial<CollectionSavedRequest> = {},
): CollectionSavedRequest {
	return {
		id,
		name: "Create user",
		draft: createDraft(),
		createdAt: "2026-11-16T10:00:00.000Z",
		updatedAt: "2026-11-16T10:00:00.000Z",
		...overrides,
	};
}

describe("createRequestCollection", () => {
	it("trims the name and description", () => {
		expect(
			createRequestCollection({
				id: "collection-1",
				name: "  DevSpace API  ",
				description: "  Reusable requests  ",
				createdAt: "2026-11-16T10:00:00.000Z",
			}),
		).toEqual({
			id: "collection-1",
			name: "DevSpace API",
			description: "Reusable requests",
			createdAt: "2026-11-16T10:00:00.000Z",
			updatedAt: "2026-11-16T10:00:00.000Z",
			requests: [],
		});
	});

	it("rejects a blank collection name", () => {
		expect(() =>
			createRequestCollection({ id: "collection-1", name: "   " }),
		).toThrow(COLLECTION_NAME_REQUIRED_MESSAGE);
	});
});

describe("updateRequestCollection", () => {
	it("updates the name, description, and timestamp", () => {
		const updated = updateRequestCollection(
			createCollection(),
			{ name: "  Updated  ", description: "  New description  " },
			"2026-11-16T11:00:00.000Z",
		);

		expect(updated.name).toBe("Updated");
		expect(updated.description).toBe("New description");
		expect(updated.updatedAt).toBe("2026-11-16T11:00:00.000Z");
	});

	it("rejects a blank collection name", () => {
		expect(() =>
			updateRequestCollection(
				createCollection(),
				{ name: "", description: "" },
				"2026-11-16T11:00:00.000Z",
			),
		).toThrow(COLLECTION_NAME_REQUIRED_MESSAGE);
	});
});

describe("createCollectionRequest", () => {
	it("stores a copy of the request draft", () => {
		const draft = createDraft();
		const request = createCollectionRequest({
			id: "request-1",
			name: "  Create user  ",
			draft,
			createdAt: "2026-11-16T10:00:00.000Z",
		});

		expect(request.name).toBe("Create user");
		expect(request.draft).toEqual(draft);
		expect(request.draft.params[0]).not.toBe(draft.params[0]);

		request.draft.body = "changed";

		expect(draft.body).toBe('{"name":"DevSpace"}');
	});

	it("rejects a blank request name", () => {
		expect(() =>
			createCollectionRequest({
				id: "request-1",
				name: "  ",
				draft: createDraft(),
			}),
		).toThrow(REQUEST_NAME_REQUIRED_MESSAGE);
	});
});

describe("collection request operations", () => {
	it("adds new requests at the beginning without duplicating ids", () => {
		const first = createSavedRequest("request-1");
		const second = createSavedRequest("request-2");
		const updated = createSavedRequest("request-1", { name: "Updated" });

		let collection = addRequestToCollection(
			createCollection(),
			first,
			"2026-11-16T10:01:00.000Z",
		);
		collection = addRequestToCollection(
			collection,
			second,
			"2026-11-16T10:02:00.000Z",
		);
		collection = addRequestToCollection(
			collection,
			updated,
			"2026-11-16T10:03:00.000Z",
		);

		expect(collection.requests.map((request) => request.id)).toEqual([
			"request-1",
			"request-2",
		]);
		expect(collection.requests[0].name).toBe("Updated");
	});

	it("renames and removes saved requests", () => {
		let collection = addRequestToCollection(
			createCollection(),
			createSavedRequest("request-1"),
			"2026-11-16T10:01:00.000Z",
		);

		collection = renameCollectionRequest(
			collection,
			"request-1",
			"  Renamed  ",
			"2026-11-16T10:02:00.000Z",
		);

		expect(collection.requests[0].name).toBe("Renamed");

		collection = removeRequestFromCollection(
			collection,
			"request-1",
			"2026-11-16T10:03:00.000Z",
		);

		expect(collection.requests).toEqual([]);
		expect(collection.updatedAt).toBe("2026-11-16T10:03:00.000Z");
	});

	it("rejects blank request names when renaming", () => {
		const collection = addRequestToCollection(
			createCollection(),
			createSavedRequest("request-1"),
			"2026-11-16T10:01:00.000Z",
		);

		expect(() =>
			renameCollectionRequest(
				collection,
				"request-1",
				"  ",
				"2026-11-16T10:02:00.000Z",
			),
		).toThrow(REQUEST_NAME_REQUIRED_MESSAGE);
	});
});

describe("removeRequestCollection", () => {
	it("removes only the requested collection", () => {
		const collections = [
			createCollection(),
			createRequestCollection({ id: "collection-2", name: "Other" }),
		];

		expect(
			removeRequestCollection(collections, "collection-1").map(
				(collection) => collection.id,
			),
		).toEqual(["collection-2"]);
	});
});

describe("toCollectionRequestDraft", () => {
	it("returns a copy of the saved draft", () => {
		const request = createSavedRequest("request-1");
		const draft = toCollectionRequestDraft(request);

		expect(draft).toEqual(request.draft);
		expect(draft.params[0]).not.toBe(request.draft.params[0]);

		draft.url = "https://changed.example.com";

		expect(request.draft.url).toBe("https://api.example.com/users");
	});
});
