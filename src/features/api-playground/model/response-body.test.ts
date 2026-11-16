import { describe, expect, it } from "bun:test";

import {
	createResponseBodyView,
	detectResponseBodyFormat,
	formatJsonBody,
	getResponseContentType,
	getResponseHeader,
} from "./response-body";
import type { HttpResponse } from "./types";

function createResponse(overrides: Partial<HttpResponse> = {}): HttpResponse {
	return {
		status: 200,
		statusText: "OK",
		headers: { "content-type": "application/json; charset=utf-8" },
		body: '{"ok":true}',
		durationMs: 12,
		sizeBytes: 11,
		...overrides,
	};
}

describe("detectResponseBodyFormat", () => {
	it("detects JSON content types, including structured suffixes", () => {
		for (const contentType of [
			"application/json",
			"application/json; charset=utf-8",
			"text/json",
			"application/problem+json",
			"application/vnd.api+json",
			"APPLICATION/JSON",
		]) {
			expect(
				detectResponseBodyFormat({ "Content-Type": contentType }, "{}"),
			).toBe("json");
		}
	});

	it("detects HTML and XML content types", () => {
		expect(
			detectResponseBodyFormat({ "content-type": "text/html" }, "<p>Hi</p>"),
		).toBe("html");
		expect(
			detectResponseBodyFormat(
				{ "content-type": "application/xhtml+xml" },
				"<html></html>",
			),
		).toBe("html");

		for (const contentType of [
			"application/xml",
			"text/xml",
			"image/svg+xml",
			"application/atom+xml",
		]) {
			expect(
				detectResponseBodyFormat({ "content-type": contentType }, "<root />"),
			).toBe("xml");
		}
	});

	it("detects binary content types", () => {
		for (const contentType of [
			"application/octet-stream",
			"application/pdf",
			"application/wasm",
			"image/png",
			"audio/mpeg",
			"video/mp4",
			"font/woff2",
		]) {
			expect(
				detectResponseBodyFormat({ "content-type": contentType }, "data"),
			).toBe("binary");
		}
	});

	it("detects text content types", () => {
		for (const contentType of [
			"text/plain",
			"text/csv",
			"application/javascript",
			"application/x-www-form-urlencoded",
		]) {
			expect(
				detectResponseBodyFormat({ "content-type": contentType }, "hello"),
			).toBe("text");
		}
	});

	it("marks unknown non-text content types as unsupported", () => {
		expect(
			detectResponseBodyFormat(
				{ "content-type": 'multipart/form-data; boundary="abc"' },
				"hello",
			),
		).toBe("unsupported");
		expect(
			detectResponseBodyFormat(
				{ "content-type": "application/x-custom" },
				"hello",
			),
		).toBe("unsupported");
	});

	it("sniffs JSON, HTML, and XML when Content-Type is missing", () => {
		expect(detectResponseBodyFormat({}, '{"ok":true}')).toBe("json");
		expect(detectResponseBodyFormat({}, "<!doctype html><html></html>")).toBe(
			"html",
		);
		expect(detectResponseBodyFormat({}, '<?xml version="1.0"?><root />')).toBe(
			"xml",
		);
	});

	it("sniffs JSON returned as text/plain", () => {
		expect(
			detectResponseBodyFormat({ "content-type": "text/plain" }, '{"ok":true}'),
		).toBe("json");
	});

	it("respects an explicit HTML content type over JSON-looking content", () => {
		expect(
			detectResponseBodyFormat({ "content-type": "text/html" }, '{"ok":true}'),
		).toBe("html");
	});

	it("detects binary content by control characters when Content-Type is missing", () => {
		expect(detectResponseBodyFormat({}, "\u0000\u0001\u0002")).toBe("binary");
	});
});

describe("getResponseContentType", () => {
	it("reads headers case-insensitively and strips parameters", () => {
		expect(
			getResponseContentType({
				"Content-Type": "Application/JSON; charset=UTF-8",
			}),
		).toBe("application/json");
		expect(getResponseHeader({ "X-Test": "one" }, "x-test")).toBe("one");
	});

	it("returns null when the header is absent", () => {
		expect(getResponseContentType({})).toBeNull();
		expect(getResponseHeader({}, "content-type")).toBeNull();
	});
});

describe("formatJsonBody", () => {
	it("formats JSON with two-space indentation", () => {
		expect(formatJsonBody('{"name":"DevSpace","items":[1,true,null]}')).toBe(
			[
				"{",
				'  "name": "DevSpace",',
				'  "items": [',
				"    1,",
				"    true,",
				"    null",
				"  ]",
				"}",
			].join("\n"),
		);
	});

	it("returns null for invalid JSON", () => {
		expect(formatJsonBody('{"name":')).toBeNull();
		expect(formatJsonBody("")).toBeNull();
	});
});

describe("createResponseBodyView", () => {
	it("returns an empty view for a blank body", () => {
		const view = createResponseBodyView(
			createResponse({ body: "   \n  ", headers: {} }),
		);

		expect(view).toEqual({ kind: "empty", contentType: null });
	});

	it("returns both raw and pretty JSON", () => {
		const raw = '{"name":"DevSpace"}';
		const view = createResponseBodyView(createResponse({ body: raw }));

		expect(view.kind).toBe("json");

		if (view.kind === "json") {
			expect(view.raw).toBe(raw);
			expect(view.pretty).toContain('\n  "name": "DevSpace"');
			expect(view.contentType).toBe("application/json");
		}
	});

	it("reports invalid JSON declared by Content-Type", () => {
		const view = createResponseBodyView(createResponse({ body: '{"name":' }));

		expect(view.kind).toBe("invalid-json");

		if (view.kind === "invalid-json") {
			expect(view.raw).toBe('{"name":');
			expect(view.message).toContain("not valid JSON");
		}
	});

	it("returns raw text, HTML, and XML views without executing them", () => {
		const text = createResponseBodyView(
			createResponse({
				headers: { "content-type": "text/plain" },
				body: "Hello, DevSpace!",
			}),
		);
		const html = createResponseBodyView(
			createResponse({
				headers: { "content-type": "text/html" },
				body: "<script>alert(1)</script>",
			}),
		);
		const xml = createResponseBodyView(
			createResponse({
				headers: { "content-type": "application/xml" },
				body: "<root><item /></root>",
			}),
		);

		expect(text).toMatchObject({
			kind: "text",
			raw: "Hello, DevSpace!",
		});
		expect(html).toMatchObject({
			kind: "html",
			raw: "<script>alert(1)</script>",
		});
		expect(xml).toMatchObject({
			kind: "xml",
			raw: "<root><item /></root>",
		});
	});

	it("returns a message for binary responses", () => {
		const view = createResponseBodyView(
			createResponse({
				headers: { "content-type": "application/octet-stream" },
				body: "\u0000\u0001",
			}),
		);

		expect(view.kind).toBe("binary");

		if (view.kind === "binary") {
			expect(view.message).toContain("binary");
			expect(view.contentType).toBe("application/octet-stream");
		}
	});

	it("returns a message for unsupported response formats", () => {
		const view = createResponseBodyView(
			createResponse({
				headers: { "content-type": "application/x-custom" },
				body: "plain content",
			}),
		);

		expect(view.kind).toBe("unsupported");

		if (view.kind === "unsupported") {
			expect(view.message).toContain("not supported");
			expect(view.contentType).toBe("application/x-custom");
		}
	});

	it("detects JSON from the body when Content-Type is absent", () => {
		const view = createResponseBodyView(
			createResponse({ headers: {}, body: '{"ok":true}' }),
		);

		expect(view.kind).toBe("json");
	});
});
