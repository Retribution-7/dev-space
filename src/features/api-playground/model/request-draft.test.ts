import { describe, expect, it } from "bun:test";

import {
	cloneRequestDraft,
	createRequestDraft,
	getFilledRowCount,
	requestDraftReducer,
	toKeyValueEntries,
} from "./request-draft";
import { HTTP_METHODS, type RequestDraft } from "./types";

function createPopulatedDraft(): RequestDraft {
	return {
		method: "POST",
		url: "https://api.example.com/users?page=2",
		params: [
			{ id: "param-page", key: "page", value: "2" },
			{ id: "param-limit", key: "limit", value: "25" },
		],
		headers: [
			{ id: "header-accept", key: "Accept", value: "application/json" },
			{ id: "header-auth", key: "Authorization", value: "Bearer token" },
		],
		bodyType: "json",
		body: '{"name":"DevSpace"}',
	};
}

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
		const draft = createPopulatedDraft();

		const state = requestDraftReducer(draft, {
			type: "set-method",
			method: "DELETE",
		});

		expect(state).toEqual({ ...draft, method: "DELETE" });
		expect(draft.method).toBe("POST");
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

	it("updates the URL without changing other populated fields", () => {
		const draft = createPopulatedDraft();
		const nextUrl = "https://api.example.com/v2/users";

		const state = requestDraftReducer(draft, {
			type: "set-url",
			url: nextUrl,
		});

		expect(state).toEqual({ ...draft, url: nextUrl });
		expect(draft.url).toBe("https://api.example.com/users?page=2");
	});

	it("updates a row without mutating the original draft", () => {
		const draft = createPopulatedDraft();
		const originalParams = draft.params;
		const originalParam = draft.params[0];

		const state = requestDraftReducer(draft, {
			type: "update-row",
			section: "params",
			id: "param-page",
			field: "value",
			value: "3",
		});

		expect(state).not.toBe(draft);
		expect(state.params).not.toBe(originalParams);
		expect(draft.params).toBe(originalParams);
		expect(draft.params[0]).toBe(originalParam);
		expect(originalParam?.value).toBe("2");
		expect(state.params[0]?.value).toBe("3");
		expect(state.method).toBe(draft.method);
		expect(state.url).toBe(draft.url);
		expect(state.headers).toBe(draft.headers);
		expect(state.bodyType).toBe(draft.bodyType);
		expect(state.body).toBe(draft.body);
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

	it("keeps multiple query parameters in order when editing and removing one", () => {
		let state = createRequestDraft();

		for (const [id, key, value] of [
			["param-page", "page", "2"],
			["param-limit", "limit", "10"],
			["param-sort", "sort", "desc"],
		] as const) {
			state = requestDraftReducer(state, {
				type: "add-row",
				section: "params",
				id,
			});
			state = requestDraftReducer(state, {
				type: "update-row",
				section: "params",
				id,
				field: "key",
				value: key,
			});
			state = requestDraftReducer(state, {
				type: "update-row",
				section: "params",
				id,
				field: "value",
				value,
			});
		}

		state = requestDraftReducer(state, {
			type: "update-row",
			section: "params",
			id: "param-limit",
			field: "value",
			value: "25",
		});

		expect(state.params).toEqual([
			{ id: "param-page", key: "page", value: "2" },
			{ id: "param-limit", key: "limit", value: "25" },
			{ id: "param-sort", key: "sort", value: "desc" },
		]);

		state = requestDraftReducer(state, {
			type: "remove-row",
			section: "params",
			id: "param-limit",
		});

		expect(state.params).toEqual([
			{ id: "param-page", key: "page", value: "2" },
			{ id: "param-sort", key: "sort", value: "desc" },
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

	it("keeps body content when the body type changes", () => {
		const draft = createPopulatedDraft();
		let state = requestDraftReducer(draft, {
			type: "set-body-type",
			bodyType: "text",
		});

		expect(state.bodyType).toBe("text");
		expect(state.body).toBe(draft.body);

		state = requestDraftReducer(state, {
			type: "set-body-type",
			bodyType: "none",
		});

		expect(state.bodyType).toBe("none");
		expect(state.body).toBe(draft.body);

		state = requestDraftReducer(state, {
			type: "set-body-type",
			bodyType: "json",
		});

		expect(state).toEqual(draft);
	});

	it("updates body content without changing the selected type or other fields", () => {
		const draft = createPopulatedDraft();
		const nextBody = '{"name":"Updated"}';

		const state = requestDraftReducer(draft, {
			type: "set-body",
			body: nextBody,
		});

		expect(state).toEqual({ ...draft, body: nextBody });
		expect(draft.body).toBe('{"name":"DevSpace"}');
	});

	it("ignores blank rows added to params and headers", () => {
		let state = createRequestDraft();

		state = requestDraftReducer(state, {
			type: "add-row",
			section: "params",
			id: "param-blank",
		});
		state = requestDraftReducer(state, {
			type: "add-row",
			section: "headers",
			id: "header-blank",
		});

		expect(getFilledRowCount(state.params)).toBe(0);
		expect(getFilledRowCount(state.headers)).toBe(0);
		expect(toKeyValueEntries(state.params)).toEqual([]);
		expect(toKeyValueEntries(state.headers)).toEqual([]);

		state = requestDraftReducer(state, {
			type: "update-row",
			section: "params",
			id: "param-blank",
			field: "key",
			value: "page",
		});
		state = requestDraftReducer(state, {
			type: "update-row",
			section: "headers",
			id: "header-blank",
			field: "key",
			value: "Accept",
		});

		expect(getFilledRowCount(state.params)).toBe(1);
		expect(getFilledRowCount(state.headers)).toBe(1);
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

describe("cloneRequestDraft", () => {
	it("copies the draft and its rows without sharing references", () => {
		const draft = createPopulatedDraft();
		const clone = cloneRequestDraft(draft);

		expect(clone).toEqual(draft);
		expect(clone.params[0]).not.toBe(draft.params[0]);
		expect(clone.headers[0]).not.toBe(draft.headers[0]);

		clone.params[0].value = "999";
		clone.body = "changed";

		expect(draft.params[0].value).toBe("2");
		expect(draft.body).toBe('{"name":"DevSpace"}');
	});
});

describe("requestDraftReducer restore-draft", () => {
	it("restores the full request configuration from a draft", () => {
		const restored = createPopulatedDraft();
		const state = requestDraftReducer(createRequestDraft(), {
			type: "restore-draft",
			draft: restored,
		});

		expect(state).toEqual(restored);
	});

	it("does not share row references with the restored draft", () => {
		const restored = createPopulatedDraft();
		const state = requestDraftReducer(createRequestDraft(), {
			type: "restore-draft",
			draft: restored,
		});

		expect(state.params[0]).not.toBe(restored.params[0]);
		expect(state.headers[0]).not.toBe(restored.headers[0]);

		state.params[0].value = "changed";

		expect(restored.params[0].value).toBe("2");
	});
});
