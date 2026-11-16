import axios, {
	AxiosError,
	AxiosHeaders,
	type AxiosRequestConfig,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
import { describe, expect, it, mock } from "bun:test";

import type { PreparedHttpRequest } from "../model/types";

import { executeRequest } from "./send-request";

function createAxiosConfig(): InternalAxiosRequestConfig {
	return { headers: new AxiosHeaders() };
}

function createResponse(overrides: Partial<AxiosResponse> = {}): AxiosResponse {
	return {
		data: '{"ok":true}',
		status: 200,
		statusText: "OK",
		headers: AxiosHeaders.from({
			"content-type": "application/json",
			"Content-Length": "11",
		}),
		config: createAxiosConfig(),
		...overrides,
	};
}

function createHttpError(
	status: number,
	statusText: string,
	data = "",
): AxiosError {
	const response = createResponse({ status, statusText, data });

	return new AxiosError(
		`Request failed with status code ${status}`,
		status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
		response.config,
		undefined,
		response,
	);
}

function createPreparedRequest(
	overrides: Partial<PreparedHttpRequest> = {},
): PreparedHttpRequest {
	return {
		method: "POST",
		url: "https://api.example.com/users",
		params: new URLSearchParams([["limit", "25"]]),
		headers: {
			"Content-Type": "application/json",
			"X-Test": "one",
		},
		data: '{"name":"DevSpace"}',
		...overrides,
	};
}

describe("executeRequest", () => {
	it("sends the prepared request and normalizes a successful response", async () => {
		const request = createPreparedRequest();
		const response = createResponse();
		const controller = new AbortController();
		let capturedConfig: AxiosRequestConfig | undefined;
		const executor = mock((config: AxiosRequestConfig) => {
			capturedConfig = config;

			return Promise.resolve(response);
		});

		const result = await executeRequest(request, {
			signal: controller.signal,
			executor,
		});

		expect(executor).toHaveBeenCalledTimes(1);
		expect(capturedConfig).toMatchObject({
			method: "POST",
			url: request.url,
			data: request.data,
			responseType: "text",
		});
		expect(capturedConfig?.params).toBe(request.params);
		expect(capturedConfig?.headers).toBe(request.headers);
		expect(capturedConfig?.signal).toBe(controller.signal);
		expect(capturedConfig?.validateStatus).toBeUndefined();

		expect(result.status).toBe("success");

		if (result.status !== "success") {
			throw new Error("Expected a successful response.");
		}

		expect(result.response.status).toBe(200);
		expect(result.response.statusText).toBe("OK");
		expect(result.response.body).toBe('{"ok":true}');
		expect(result.response.headers["content-type"]).toBe("application/json");
		expect(result.response.sizeBytes).toBe(11);
		expect(result.response.durationMs).toBeGreaterThanOrEqual(0);
	});

	it("returns 4xx responses as HTTP errors with status, headers, and body", async () => {
		const executor = mock(() =>
			Promise.reject(createHttpError(404, "Not Found", '{"error":"missing"}')),
		);

		const result = await executeRequest(createPreparedRequest(), {
			executor,
		});

		expect(result.status).toBe("http-error");

		if (result.status !== "http-error") {
			throw new Error("Expected an HTTP error response.");
		}

		expect(result.response.status).toBe(404);
		expect(result.response.statusText).toBe("Not Found");
		expect(result.response.body).toBe('{"error":"missing"}');
		expect(result.response.headers["content-type"]).toBe("application/json");
	});

	it("returns 5xx responses as HTTP errors", async () => {
		for (const status of [500, 503]) {
			const executor = mock(() =>
				Promise.reject(createHttpError(status, "Server Error")),
			);

			const result = await executeRequest(createPreparedRequest(), {
				executor,
			});

			expect(result.status).toBe("http-error");

			if (result.status === "http-error") {
				expect(result.response.status).toBe(status);
			}
		}
	});

	it("classifies Axios errors without a response as network errors", async () => {
		const executor = mock(() =>
			Promise.reject(new AxiosError("Network Error", AxiosError.ERR_NETWORK)),
		);

		const result = await executeRequest(createPreparedRequest(), {
			executor,
		});

		expect(result).toEqual({
			status: "network-error",
			message:
				"Network request failed. Check the URL, your connection, and the server's CORS policy.",
			code: "ERR_NETWORK",
		});
	});

	it("classifies aborted requests as canceled", async () => {
		const controller = new AbortController();
		const executor = mock(
			(config: AxiosRequestConfig) =>
				new Promise<AxiosResponse>((_resolve, reject) => {
					const signal = config.signal as AbortSignal | undefined;

					signal?.addEventListener(
						"abort",
						() => reject(new axios.CanceledError("canceled")),
						{ once: true },
					);
				}),
		);

		const execution = executeRequest(createPreparedRequest(), {
			signal: controller.signal,
			executor,
		});

		controller.abort();

		expect(await execution).toEqual({ status: "canceled" });
	});

	it("does not reject when an unexpected error occurs", async () => {
		const executor = mock(() => Promise.reject(new Error("boom")));

		const result = await executeRequest(createPreparedRequest(), {
			executor,
		});

		expect(result.status).toBe("unexpected-error");

		if (result.status === "unexpected-error") {
			expect(result.message).toContain("boom");
		}
	});

	it("falls back to the decoded body length when Content-Length is missing", async () => {
		const response = createResponse({
			data: "hello",
			headers: AxiosHeaders.from({ "content-type": "text/plain" }),
		});
		const executor = mock(() => Promise.resolve(response));

		const result = await executeRequest(createPreparedRequest(), {
			executor,
		});

		expect(result.status).toBe("success");

		if (result.status === "success") {
			expect(result.response.sizeBytes).toBe(5);
		}
	});
});
