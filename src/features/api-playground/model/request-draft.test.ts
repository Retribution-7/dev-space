import { describe, expect, it } from "bun:test";

import {
	createRequestDraft,
	getFilledRowCount,
	requestDraftReducer,
	toKeyValueEntries,
} from "./request-draft";
import { HTTP_METHODS, type RequestDraft } from "./types";

describe("HTTP methods", () => {
	it("exposes all supported methods", () => {
		expect(HTTP_METHODS).toEqual([
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"HEAD",
			"OPTIONS",
		]);
	});

	it("stores every method selected through the reducer", () => {
		for (const method of HTTP_METHODS) {
			const state = requestDraftReducer(createRequestDraft(), {
				type: "set-method",
				method,
			});

			expect(state.method).toBe(method);
		}
	});
});

describe("createRequestDraft", () => {
	it("starts with a GET request and no parameters, headers, or body", () => {
		expect(createRequestDraft()).toEqual({
			method: "GET",
			url: "",
			params: [],
			headers: [],
			bodyType: "none",
			body: "",
		});
	});
});

describe("requestDraftReducer", () => {
	it("updates the method and URL without touching other fields", () => {
		let state = createRequestDraft();

		state = requestDraftReducer(state, {
			type: "set-method",
			method: "PATCH",
		});
		state = requestDraftReducer(state, {
			type: "set-url",
			url: "https://api.example.com/users/1",
		});

		expect(state).toEqual({
			method: "PATCH",
			url: "https://api.example.com/users/1",
			params: [],
			headers: [],
			bodyType: "none",
			body: "",
		});
	});

	it("keeps URL, params, headers, and body when the method changes", () => {
		const draft: RequestDraft = {
			method: "GET",
			url: "https://api.example.com/users?page=2",
			params: [{ id: "param-1", key: "page", value: "2" }],
			headers: [{ id: "header-1", key: "Accept", value: "application/json" }],
			bodyType: "json",
			body: '{"name":"DevSpace"}',
		};

		const state = requestDraftReducer(draft, {
			type: "set-method",
			method: "DELETE",
		});

		expect(state).toEqual({ ...draft, method: "DELETE" });
		expect(draft.method).toBe("GET");
	});

	it("keeps the selected method when other request fields change", () => {
		let state = requestDraftReducer(createRequestDraft(), {
			type: "set-method",
			method: "OPTIONS",
		});

		state = requestDraftReducer(state, {
			type: "set-url",
			url: "https://api.example.com/users",
		});
		state = requestDraftReducer(state, {
			type: "add-row",
			section: "params",
			id: "param-1",
		});
		state = requestDraftReducer(state, {
			type: "add-row",
			section: "headers",
			id: "header-1",
		});
		state = requestDraftReducer(state, {
			type: "set-body-type",
			bodyType: "json",
		});
		state = requestDraftReducer(state, {
			type: "set-body",
			body: '{"name":"DevSpace"}',
		});

		expect(state.method).toBe("OPTIONS");
	});

	it("adds rows to the requested section with the provided id", () => {
		const initial = createRequestDraft();
		const withParam = requestDraftReducer(initial, {
			type: "add-row",
			section: "params",
			id: "param-1",
		});
		const withHeader = requestDraftReducer(withParam, {
			type: "add-row",
			section: "headers",
			id: "header-1",
		});

		expect(withHeader.params).toEqual([{ id: "param-1", key: "", value: "" }]);
		expect(withHeader.headers).toEqual([
			{ id: "header-1", key: "", value: "" },
		]);
		expect(initial.params).toEqual([]);
		expect(initial.headers).toEqual([]);
	});

	it("edits keys and values in the requested section only", () => {
		let state = createRequestDraft();

		state = requestDraftReducer(state, {
			type: "add-row",
			section: "params",
			id: "param-1",
		});
		state = requestDraftReducer(state, {
			type: "add-row",
			section: "headers",
			id: "header-1",
		});
		state = requestDraftReducer(state, {
			type: "update-row",
			section: "params",
			id: "param-1",
			field: "key",
			value: "page",
		});
		state = requestDraftReducer(state, {
			type: "update-row",
			section: "params",
			id: "param-1",
			field: "value",
			value: "2",
		});
		state = requestDraftReducer(state, {
			type: "update-row",
			section: "headers",
			id: "header-1",
			field: "key",
			value: "Accept",
		});

		expect(state.params).toEqual([{ id: "param-1", key: "page", value: "2" }]);
		expect(state.headers).toEqual([
			{ id: "header-1", key: "Accept", value: "" },
		]);
	});

	it("removes a query parameter without touching headers", () => {
		let state = createRequestDraft();

		state = requestDraftReducer(state, {
			type: "add-row",
			section: "params",
			id: "param-1",
		});
		state = requestDraftReducer(state, {
			type: "add-row",
			section: "headers",
			id: "header-1",
		});
		state = requestDraftReducer(state, {
			type: "update-row",
			section: "headers",
			id: "header-1",
			field: "key",
			value: "Accept",
		});
		state = requestDraftReducer(state, {
			type: "remove-row",
			section: "params",
			id: "param-1",
		});

		expect(state.params).toEqual([]);
		expect(state.headers).toEqual([
			{ id: "header-1", key: "Accept", value: "" },
		]);
	});

	it("removes only the requested row", () => {
		let state = createRequestDraft();

		state = requestDraftReducer(state, {
			type: "add-row",
			section: "headers",
			id: "header-1",
		});
		state = requestDraftReducer(state, {
			type: "add-row",
			section: "headers",
			id: "header-2",
		});
		state = requestDraftReducer(state, {
			type: "update-row",
			section: "headers",
			id: "header-2",
			field: "key",
			value: "X-Request-Id",
		});
		state = requestDraftReducer(state, {
			type: "remove-row",
			section: "headers",
			id: "header-1",
		});

		expect(state.headers).toEqual([
			{ id: "header-2", key: "X-Request-Id", value: "" },
		]);
	});

	it("returns the same state for unknown rows", () => {
		const state = createRequestDraft();
		const updated = requestDraftReducer(state, {
			type: "update-row",
			section: "params",
			id: "missing",
			field: "key",
			value: "page",
		});
		const removed = requestDraftReducer(state, {
			type: "remove-row",
			section: "params",
			id: "missing",
		});

		expect(updated).toBe(state);
		expect(removed).toBe(state);
	});

	it("updates the body type and content", () => {
		let state = createRequestDraft();

		state = requestDraftReducer(state, {
			type: "set-body-type",
			bodyType: "json",
		});
		state = requestDraftReducer(state, {
			type: "set-body",
			body: '{"name":"DevSpace"}',
		});

		expect(state.bodyType).toBe("json");
		expect(state.body).toBe('{"name":"DevSpace"}');
	});
});

describe("toKeyValueEntries", () => {
	it("ignores blank rows and rows without a key", () => {
		expect(
			toKeyValueEntries([
				{ id: "1", key: "page", value: "2" },
				{ id: "2", key: "", value: "" },
				{ id: "3", key: "   ", value: "orphan" },
				{ id: "4", key: "query", value: "" },
			]),
		).toEqual([
			{ key: "page", value: "2" },
			{ key: "query", value: "" },
		]);
	});

	it("trims surrounding whitespace from keys and values", () => {
		expect(
			toKeyValueEntries([
				{ id: "1", key: "  Authorization  ", value: "  Bearer token  " },
			]),
		).toEqual([{ key: "Authorization", value: "Bearer token" }]);
	});

	it("preserves duplicate keys and row order", () => {
		expect(
			toKeyValueEntries([
				{ id: "1", key: "tag", value: "one" },
				{ id: "2", key: "tag", value: "two" },
			]),
		).toEqual([
			{ key: "tag", value: "one" },
			{ key: "tag", value: "two" },
		]);
	});
});

describe("getFilledRowCount", () => {
	it("counts only rows that have a key", () => {
		expect(
			getFilledRowCount([
				{ id: "1", key: "page", value: "2" },
				{ id: "2", key: "", value: "" },
				{ id: "3", key: "", value: "orphan" },
				{ id: "4", key: "limit", value: "10" },
			]),
		).toBe(2);
	});
});
