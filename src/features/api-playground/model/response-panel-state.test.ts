import { describe, expect, it } from "bun:test";

import { getResponsePanelView } from "./response-panel-state";
import type { HttpResponse, RequestExecution } from "./types";

function createResponse(overrides: Partial<HttpResponse> = {}): HttpResponse {
	return {
		status: 200,
		statusText: "OK",
		headers: { "content-type": "application/json" },
		body: '{"ok":true}',
		durationMs: 42,
		sizeBytes: 11,
		...overrides,
	};
}

describe("getResponsePanelView", () => {
	it("shows the empty state before the first request", () => {
		expect(getResponsePanelView(null, false)).toEqual({ kind: "empty" });
	});

	it("shows loading instead of a previous result while sending", () => {
		const execution: RequestExecution = {
			status: "success",
			response: createResponse(),
		};

		expect(getResponsePanelView(execution, true)).toEqual({ kind: "loading" });
	});

	it("shows a full response for successful requests", () => {
		const response = createResponse();
		const view = getResponsePanelView({ status: "success", response }, false);

		expect(view).toEqual({ kind: "response", response });
	});

	it("shows a full response for HTTP errors", () => {
		const response = createResponse({
			status: 404,
			statusText: "Not Found",
			body: '{"error":"missing"}',
		});
		const view = getResponsePanelView(
			{ status: "http-error", response },
			false,
		);

		expect(view).toEqual({ kind: "response", response });
	});

	it("shows network errors without an HTTP response", () => {
		expect(
			getResponsePanelView(
				{
					status: "network-error",
					message: "Network request failed.",
					code: "ERR_NETWORK",
				},
				false,
			),
		).toEqual({
			kind: "network-error",
			message: "Network request failed.",
			code: "ERR_NETWORK",
		});
	});

	it("shows cancellation without an HTTP response", () => {
		expect(getResponsePanelView({ status: "canceled" }, false)).toEqual({
			kind: "canceled",
		});
	});

	it("shows unexpected failures without an HTTP response", () => {
		expect(
			getResponsePanelView(
				{
					status: "unexpected-error",
					message: "Something went wrong.",
				},
				false,
			),
		).toEqual({
			kind: "unexpected-error",
			message: "Something went wrong.",
		});
	});
});
