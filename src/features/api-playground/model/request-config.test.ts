import axios from "axios";
import { describe, expect, it } from "bun:test";

import { prepareRequest } from "./request-config";
import { createRequestDraft } from "./request-draft";
import type {
	KeyValueRow,
	PreparedHttpRequest,
	RequestDraft,
	RequestValidationIssue,
} from "./types";

function createRows(entries: Array<[string, string]>): KeyValueRow[] {
	return entries.map(([key, value], index) => ({
		id: `row-${index}`,
		key,
		value,
	}));
}

function createDraft(overrides: Partial<RequestDraft> = {}): RequestDraft {
	return {
		...createRequestDraft(),
		url: "https://api.example.com/users",
		...overrides,
	};
}

function prepareOk(draft: RequestDraft): PreparedHttpRequest {
	const result = prepareRequest(draft);

	if (!result.ok) {
		throw new Error(`Expected a valid request: ${result.issue.message}`);
	}

	return result.request;
}

function prepareIssue(draft: RequestDraft): RequestValidationIssue {
	const result = prepareRequest(draft);

	if (result.ok) {
		throw new Error("Expected the request to be invalid.");
	}

	return result.issue;
}

function getRequestUrl(request: PreparedHttpRequest): string {
	return axios.getUri({ url: request.url, params: request.params });
}

describe("prepareRequest URL and query parameters", () => {
	it("appends query parameters to the request URL", () => {
		const request = prepareOk(
			createDraft({
				url: "https://api.example.com/users",
				params: createRows([
					["page", "2"],
					["limit", "25"],
				]),
			}),
		);

		expect(getRequestUrl(request)).toBe(
			"https://api.example.com/users?page=2&limit=25",
		);
	});

	it("preserves query parameters already present in the URL", () => {
		const request = prepareOk(
			createDraft({
				url: "https://api.example.com/users?page=1&q=a%20b",
				params: createRows([["limit", "25"]]),
			}),
		);

		expect(getRequestUrl(request)).toBe(
			"https://api.example.com/users?page=1&q=a%20b&limit=25",
		);
	});

	it("supports duplicate keys and encodes keys and values exactly once", () => {
		const request = prepareOk(
			createDraft({
				url: "https://api.example.com/search",
				params: createRows([
					["tag", "a b&c=d"],
					["tag", "2"],
					["space key", "hello world"],
				]),
			}),
		);

		const requestUrl = getRequestUrl(request);

		expect(requestUrl).toBe(
			"https://api.example.com/search?tag=a+b%26c%3Dd&tag=2&space+key=hello+world",
		);
		expect(requestUrl).not.toContain("%2520");
		expect(requestUrl).not.toContain("%2526");
	});

	it("ignores rows without a key and keeps empty values", () => {
		const request = prepareOk(
			createDraft({
				url: "https://api.example.com/users",
				params: createRows([
					["", "ignored"],
					["   ", "ignored"],
					["flag", ""],
				]),
			}),
		);

		expect(getRequestUrl(request)).toBe("https://api.example.com/users?flag=");
	});

	it("does not add a query string when no parameters are filled", () => {
		const request = prepareOk(
			createDraft({ url: "https://api.example.com/users" }),
		);

		expect(getRequestUrl(request)).toBe("https://api.example.com/users");
	});

	it("trims and normalizes the URL", () => {
		const request = prepareOk(
			createDraft({ url: "  https://api.example.com/users  " }),
		);

		expect(request.url).toBe("https://api.example.com/users");
	});
});

describe("prepareRequest URL validation", () => {
	it("rejects an empty URL", () => {
		const issue = prepareIssue(createDraft({ url: "   " }));

		expect(issue.code).toBe("empty-url");
		expect(issue.message).toContain("URL");
	});

	it("rejects a relative URL", () => {
		expect(prepareIssue(createDraft({ url: "/users" })).code).toBe(
			"invalid-url",
		);
	});

	it("rejects a malformed absolute URL", () => {
		expect(prepareIssue(createDraft({ url: "https://" })).code).toBe(
			"invalid-url",
		);
	});

	it("rejects unsupported protocols", () => {
		for (const url of [
			"ftp://example.com/file",
			"file:///tmp/data.json",
			"javascript:alert(1)",
		]) {
			expect(prepareIssue(createDraft({ url })).code).toBe(
				"unsupported-protocol",
			);
		}
	});

	it("accepts HTTP and HTTPS URLs", () => {
		for (const url of ["http://example.com", "https://example.com"]) {
			expect(prepareRequest(createDraft({ url })).ok).toBe(true);
		}
	});
});

describe("prepareRequest headers", () => {
	it("builds headers from filled rows and ignores keyless rows", () => {
		const request = prepareOk(
			createDraft({
				headers: createRows([
					[" Accept ", " application/json "],
					["", "ignored"],
					[" X-Test ", " one "],
				]),
			}),
		);

		expect(request.headers).toEqual({
			Accept: "application/json",
			"X-Test": "one",
		});
	});

	it("uses the last value for duplicate header names", () => {
		const request = prepareOk(
			createDraft({
				headers: createRows([
					["X-Test", "one"],
					["x-test", "two"],
				]),
			}),
		);

		expect(request.headers).toEqual({ "x-test": "two" });
	});

	it("adds a JSON content type only when it is not set by the user", () => {
		const autoRequest = prepareOk(
			createDraft({
				method: "POST",
				bodyType: "json",
				body: '{"ok":true}',
			}),
		);

		expect(autoRequest.headers).toEqual({
			"Content-Type": "application/json",
		});

		const customRequest = prepareOk(
			createDraft({
				method: "POST",
				bodyType: "json",
				body: '{"ok":true}',
				headers: createRows([["content-type", "application/vnd.api+json"]]),
			}),
		);

		expect(customRequest.headers).toEqual({
			"content-type": "application/vnd.api+json",
		});
	});

	it("adds text/plain for a text body", () => {
		const request = prepareOk(
			createDraft({
				method: "POST",
				bodyType: "text",
				body: "Hello, DevSpace!",
			}),
		);

		expect(request.headers["Content-Type"]).toBe("text/plain");
	});

	it("keeps user headers when no body is sent", () => {
		const request = prepareOk(
			createDraft({
				method: "GET",
				headers: createRows([["Accept", "application/json"]]),
			}),
		);

		expect(request.headers).toEqual({ Accept: "application/json" });
	});
});

describe("prepareRequest body", () => {
	it("sends JSON content and sets application/json", () => {
		const body = '{"name": "DevSpace"}';
		const request = prepareOk(
			createDraft({ method: "POST", bodyType: "json", body }),
		);

		expect(request.data).toBe(body);
		expect(request.headers["Content-Type"]).toBe("application/json");
	});

	it("sends text content and sets text/plain", () => {
		const body = "Hello, DevSpace!";
		const request = prepareOk(
			createDraft({ method: "PUT", bodyType: "text", body }),
		);

		expect(request.data).toBe(body);
		expect(request.headers["Content-Type"]).toBe("text/plain");
	});

	it("does not send a body or validate it for GET and HEAD", () => {
		for (const method of ["GET", "HEAD"] as const) {
			const request = prepareOk(
				createDraft({
					method,
					bodyType: "json",
					body: "{invalid",
				}),
			);

			expect(request.data).toBeUndefined();
			expect(request.headers["Content-Type"]).toBeUndefined();
		}
	});

	it("does not send or validate a body when None is selected", () => {
		const request = prepareOk(
			createDraft({
				method: "POST",
				bodyType: "none",
				body: "{invalid",
			}),
		);

		expect(request.data).toBeUndefined();
		expect(request.headers["Content-Type"]).toBeUndefined();
	});

	it("sends bodies for methods other than GET and HEAD", () => {
		const body = '{"ok":true}';

		for (const method of [
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		] as const) {
			const request = prepareOk(
				createDraft({ method, bodyType: "json", body }),
			);

			expect(request.data).toBe(body);
			expect(request.headers["Content-Type"]).toBe("application/json");
		}
	});

	it("rejects invalid JSON bodies", () => {
		const issue = prepareIssue(
			createDraft({
				method: "POST",
				bodyType: "json",
				body: '{"name":',
			}),
		);

		expect(issue.code).toBe("invalid-json");
		expect(issue.message).toContain("JSON");
	});

	it("rejects an empty JSON body", () => {
		const issue = prepareIssue(
			createDraft({
				method: "POST",
				bodyType: "json",
				body: "   ",
			}),
		);

		expect(issue.code).toBe("invalid-json");
	});

	it("does not mutate the draft", () => {
		const draft = createDraft({
			method: "POST",
			url: "https://api.example.com/users",
			params: createRows([["page", "2"]]),
			headers: createRows([["Accept", "application/json"]]),
			bodyType: "json",
			body: '{"ok":true}',
		});
		const snapshot = {
			...draft,
			params: draft.params.map((row) => ({ ...row })),
			headers: draft.headers.map((row) => ({ ...row })),
		};

		prepareRequest(draft);

		expect(draft).toEqual(snapshot);
	});
});

describe("prepareRequest mixed content protection", () => {
	it("rejects HTTP URLs when the page is served over HTTPS", () => {
		const result = prepareRequest(
			createDraft({ url: "http://api.example.com/users" }),
			{ pageProtocol: "https:" },
		);

		expect(result.ok).toBe(false);

		if (!result.ok) {
			expect(result.issue.code).toBe("mixed-content");
			expect(result.issue.message).toContain("mixed content");
		}
	});

	it("allows HTTP URLs when the page is served over HTTP", () => {
		expect(
			prepareRequest(createDraft({ url: "http://api.example.com/users" }), {
				pageProtocol: "http:",
			}).ok,
		).toBe(true);
	});

	it("allows HTTP URLs to loopback hosts", () => {
		for (const url of [
			"http://localhost:3000/api",
			"http://127.0.0.1:8080/api",
		]) {
			expect(
				prepareRequest(createDraft({ url }), {
					pageProtocol: "https:",
				}).ok,
			).toBe(true);
		}
	});

	it("allows HTTPS URLs when the page is served over HTTPS", () => {
		expect(
			prepareRequest(createDraft({ url: "https://api.example.com/users" }), {
				pageProtocol: "https:",
			}).ok,
		).toBe(true);
	});

	it("does not block anything when the page protocol is unknown", () => {
		expect(
			prepareRequest(createDraft({ url: "http://api.example.com/users" })).ok,
		).toBe(true);
	});
});
