import axios, {
	AxiosError,
	AxiosHeaders,
	type AxiosRequestConfig,
	type AxiosResponse,
	type RawAxiosHeaders,
} from "axios";

import {
	createTimeoutErrorMessage,
	NETWORK_ERROR_HINTS,
	NETWORK_ERROR_MESSAGE,
	UNEXPECTED_REQUEST_ERROR_MESSAGE,
} from "../model/request-errors";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../model/request-timeout";
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
	timeoutMs?: number;
	executor?: RequestExecutor;
};

const NETWORK_ERROR_CODES = new Set([
	AxiosError.ERR_NETWORK,
	AxiosError.ECONNREFUSED,
]);

const TIMEOUT_ERROR_CODES = new Set([
	AxiosError.ETIMEDOUT,
	AxiosError.ECONNABORTED,
]);

const httpClient = axios.create();

const defaultRequestExecutor: RequestExecutor = (config) =>
	httpClient.request(config);

export async function executeRequest(
	request: PreparedHttpRequest,
	{
		signal,
		timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
		executor = defaultRequestExecutor,
	}: ExecuteRequestOptions = {},
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
			timeout: timeoutMs,
			signal,
		});

		return {
			status: "success",
			response: createHttpResponse(response, performance.now() - startedAt),
		};
	} catch (error) {
		const durationMs = performance.now() - startedAt;

		if (
			axios.isCancel(error) ||
			(axios.isAxiosError(error) && error.code === AxiosError.ERR_CANCELED)
		) {
			return { status: "canceled" };
		}

		if (axios.isAxiosError(error)) {
			if (error.response) {
				return {
					status: "http-error",
					response: createHttpResponse(error.response, durationMs),
				};
			}

			if (error.code && TIMEOUT_ERROR_CODES.has(error.code)) {
				return {
					status: "timeout",
					message: createTimeoutErrorMessage(timeoutMs),
					timeoutMs,
				};
			}

			if (!error.code || NETWORK_ERROR_CODES.has(error.code)) {
				return {
					status: "network-error",
					message: NETWORK_ERROR_MESSAGE,
					...(error.code ? { code: error.code } : {}),
					hints: [...NETWORK_ERROR_HINTS],
				};
			}

			return {
				status: "unexpected-error",
				message: UNEXPECTED_REQUEST_ERROR_MESSAGE,
				code: error.code,
			};
		}

		return {
			status: "unexpected-error",
			message: UNEXPECTED_REQUEST_ERROR_MESSAGE,
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
