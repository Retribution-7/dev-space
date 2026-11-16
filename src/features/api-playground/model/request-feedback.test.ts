import { describe, expect, it } from "bun:test";

import {
	describeRequestExecution,
	formatBytes,
	formatDuration,
} from "./request-feedback";
import type { HttpResponse } from "./types";

function createResponse(overrides: Partial<HttpResponse> = {}): HttpResponse {
	return {
		status: 200,
		statusText: "OK",
		headers: {},
		body: "",
		durationMs: 123,
		sizeBytes: 512,
		...overrides,
	};
}

describe("describeRequestExecution", () => {
	it("shows the status, duration, and size of a successful response", () => {
		const feedback = describeRequestExecution({
			status: "success",
			response: createResponse(),
		});

		expect(feedback.tone).toBe("success");
		expect(feedback.message).toContain("HTTP 200 OK");
		expect(feedback.message).toContain("123 ms");
		expect(feedback.message).toContain("512 B");
	});

	it("marks HTTP error responses as warnings without hiding the status", () => {
		const feedback = describeRequestExecution({
			status: "http-error",
			response: createResponse({
				status: 404,
				statusText: "Not Found",
				sizeBytes: 27,
			}),
		});

		expect(feedback.tone).toBe("warning");
		expect(feedback.message).toContain("HTTP 404 Not Found");
		expect(feedback.message).not.toContain("Network request failed");
	});

	it("formats network errors with the Axios error code", () => {
		const feedback = describeRequestExecution({
			status: "network-error",
			message: "The request could not reach the server.",
			code: "ERR_NETWORK",
			hints: ["Check the URL and the server."],
		});

		expect(feedback.tone).toBe("error");
		expect(feedback.message).toContain(
			"The request could not reach the server.",
		);
		expect(feedback.message).toContain("ERR_NETWORK");
	});

	it("formats timeout errors with the configured duration", () => {
		const feedback = describeRequestExecution({
			status: "timeout",
			message:
				"The request timed out after 30 seconds. The server did not respond in time; try again or increase the timeout.",
			timeoutMs: 30_000,
		});

		expect(feedback.tone).toBe("error");
		expect(feedback.message).toContain("timed out");
	});

	it("formats unexpected errors without exposing the raw error", () => {
		const feedback = describeRequestExecution({
			status: "unexpected-error",
			message: "Something went wrong while sending the request.",
			code: "ERR_BAD_OPTION",
		});

		expect(feedback.tone).toBe("error");
		expect(feedback.message).toContain("Something went wrong");
		expect(feedback.message).toContain("ERR_BAD_OPTION");
	});

	it("formats canceled requests separately", () => {
		expect(describeRequestExecution({ status: "canceled" })).toEqual({
			tone: "info",
			message: "Request canceled.",
		});
	});
});

describe("formatDuration", () => {
	it("formats milliseconds and seconds", () => {
		expect(formatDuration(123.4)).toBe("123 ms");
		expect(formatDuration(1500)).toBe("1.50 s");
	});
});

describe("formatBytes", () => {
	it("formats bytes, kilobytes, and megabytes", () => {
		expect(formatBytes(512)).toBe("512 B");
		expect(formatBytes(1536)).toBe("1.5 KB");
		expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
	});
});
