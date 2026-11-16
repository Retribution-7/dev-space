import { describe, expect, it } from "bun:test";

import {
	createRequestSendState,
	requestSendReducer,
} from "./request-send-state";
import type {
	HttpResponse,
	RequestExecution,
	RequestValidationIssue,
} from "./types";

function createResponse(overrides: Partial<HttpResponse> = {}): HttpResponse {
	return {
		status: 200,
		statusText: "OK",
		headers: {},
		body: '{"ok":true}',
		durationMs: 10,
		sizeBytes: 11,
		...overrides,
	};
}

describe("requestSendReducer", () => {
	it("starts loading and keeps the previous execution", () => {
		const execution: RequestExecution = {
			status: "success",
			response: createResponse(),
		};
		let state = createRequestSendState();

		state = requestSendReducer(state, { type: "settled", execution });
		state = requestSendReducer(state, { type: "start" });

		expect(state.isSending).toBe(true);
		expect(state.execution).toBe(execution);
		expect(state.validationIssue).toBeNull();
	});

	it("stops loading for every settled outcome", () => {
		const executions: RequestExecution[] = [
			{ status: "success", response: createResponse() },
			{
				status: "http-error",
				response: createResponse({
					status: 404,
					statusText: "Not Found",
				}),
			},
			{
				status: "network-error",
				message: "The request could not reach the server.",
				hints: ["Check the URL and the server."],
			},
			{
				status: "timeout",
				message: "The request timed out after 30 seconds.",
				timeoutMs: 30_000,
			},
			{ status: "canceled" },
			{ status: "unexpected-error", message: "Unexpected error." },
		];

		for (const execution of executions) {
			let state = requestSendReducer(createRequestSendState(), {
				type: "start",
			});

			state = requestSendReducer(state, {
				type: "settled",
				execution,
			});

			expect(state.isSending).toBe(false);
			expect(state.execution).toBe(execution);
			expect(state.validationIssue).toBeNull();
		}
	});

	it("stops loading and reports a validation issue when preparation fails", () => {
		const issue: RequestValidationIssue = {
			code: "invalid-url",
			message: "Enter a valid URL.",
		};
		let state = requestSendReducer(createRequestSendState(), {
			type: "start",
		});

		state = requestSendReducer(state, {
			type: "validation-failed",
			issue,
		});

		expect(state.isSending).toBe(false);
		expect(state.validationIssue).toBe(issue);
	});

	it("clears a validation issue without losing the last execution", () => {
		const execution: RequestExecution = { status: "canceled" };
		let state = requestSendReducer(createRequestSendState(), {
			type: "settled",
			execution,
		});

		state = requestSendReducer(state, {
			type: "validation-failed",
			issue: { code: "empty-url", message: "Enter a request URL." },
		});
		state = requestSendReducer(state, { type: "clear-validation" });

		expect(state.validationIssue).toBeNull();
		expect(state.execution).toBe(execution);
	});

	it("clears a validation issue when a new request starts", () => {
		let state = requestSendReducer(createRequestSendState(), {
			type: "validation-failed",
			issue: { code: "invalid-url", message: "Enter a valid URL." },
		});

		state = requestSendReducer(state, { type: "start" });

		expect(state.validationIssue).toBeNull();
		expect(state.isSending).toBe(true);
	});

	it("replaces a previous error with a successful execution", () => {
		const successExecution: RequestExecution = {
			status: "success",
			response: createResponse(),
		};
		let state = requestSendReducer(createRequestSendState(), {
			type: "settled",
			execution: {
				status: "network-error",
				message: "The request could not reach the server.",
				hints: [],
			},
		});

		state = requestSendReducer(state, {
			type: "settled",
			execution: successExecution,
		});

		expect(state.execution).toBe(successExecution);
		expect(state.validationIssue).toBeNull();
	});

	it("returns the same state when there is no validation issue to clear", () => {
		const state = createRequestSendState();

		expect(requestSendReducer(state, { type: "clear-validation" })).toBe(state);
	});
});
