import axios, {
	AxiosHeaders,
	type AxiosRequestConfig,
	type AxiosResponse,
	type RawAxiosHeaders,
} from "axios";

import type {
	HttpResponse,
	PreparedHttpRequest,
	RequestExecution,
} from "../model/types";

export type RequestExecutor = (
	config: AxiosRequestConfig,
) => Promise<AxiosResponse>;

export type ExecuteRequestOptions = {
	signal?: AbortSignal;
	executor?: RequestExecutor;
};

const httpClient = axios.create();

const defaultRequestExecutor: RequestExecutor = (config) =>
	httpClient.request(config);

export async function executeRequest(
	request: PreparedHttpRequest,
	{ signal, executor = defaultRequestExecutor }: ExecuteRequestOptions = {},
): Promise<RequestExecution> {
	const startedAt = performance.now();

	try {
		const response = await executor({
			method: request.method,
			url: request.url,
			params: request.params,
			headers: request.headers,
			data: request.data,
			responseType: "text",
			signal,
		});

		return {
			status: "success",
			response: createHttpResponse(response, performance.now() - startedAt),
		};
	} catch (error) {
		const durationMs = performance.now() - startedAt;

		if (axios.isCancel(error)) {
			return { status: "canceled" };
		}

		if (axios.isAxiosError(error)) {
			if (error.response) {
				return {
					status: "http-error",
					response: createHttpResponse(error.response, durationMs),
				};
			}

			return {
				status: "network-error",
				message:
					"Network request failed. Check the URL, your connection, and the server's CORS policy.",
				code: error.code,
			};
		}

		return {
			status: "unexpected-error",
			message: getUnexpectedErrorMessage(error),
		};
	}
}

function createHttpResponse(
	response: AxiosResponse,
	durationMs: number,
): HttpResponse {
	const body = toResponseText(response.data);
	const headers = normalizeResponseHeaders(response.headers);

	return {
		status: response.status,
		statusText: response.statusText ?? "",
		headers,
		body,
		durationMs,
		sizeBytes: getResponseSize(headers, body),
	};
}

function normalizeResponseHeaders(
	headers: AxiosResponse["headers"],
): Record<string, string> {
	return AxiosHeaders.from(headers as RawAxiosHeaders).toJSON(true);
}

function toResponseText(data: unknown): string {
	if (typeof data === "string") {
		return data;
	}

	if (data == null) {
		return "";
	}

	if (data instanceof ArrayBuffer) {
		return new TextDecoder().decode(data);
	}

	try {
		return JSON.stringify(data) ?? String(data);
	} catch {
		return String(data);
	}
}

function getResponseSize(
	headers: Record<string, string>,
	body: string,
): number {
	const contentLength = Object.entries(headers).find(
		([key]) => key.toLowerCase() === "content-length",
	)?.[1];

	if (contentLength && /^\d+$/.test(contentLength)) {
		return Number(contentLength);
	}

	return new TextEncoder().encode(body).byteLength;
}

function getUnexpectedErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return `Something went wrong while sending the request: ${error.message}`;
	}

	return "Something went wrong while sending the request.";
}
