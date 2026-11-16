import { toKeyValueEntries } from "./request-draft";
import { MIXED_CONTENT_MESSAGE } from "./request-errors";
import type {
	KeyValueEntry,
	KeyValueRow,
	PrepareRequestResult,
	RequestDraft,
	RequestValidationIssue,
} from "./types";

const EMPTY_URL_MESSAGE = "Enter a request URL.";
const INVALID_URL_MESSAGE =
	"Enter a valid absolute URL, for example https://api.example.com/users.";
const INVALID_JSON_MESSAGE =
	"Request body is not valid JSON. Check the syntax and try again.";

export type PrepareRequestOptions = {
	pageProtocol?: string;
};

export type RequestBodyBuildResult =
	| { ok: true; data?: string; contentType?: string }
	| { ok: false; message: string };

type RequestUrlResult =
	{ ok: true; url: string } | { ok: false; issue: RequestValidationIssue };

export function buildQueryParams(rows: KeyValueRow[]): URLSearchParams {
	const params = new URLSearchParams();

	for (const entry of toKeyValueEntries(rows)) {
		params.append(entry.key, entry.value);
	}

	return params;
}

/**
 * Builds the request headers and adds an automatic Content-Type only when the
 * user has not already provided one. Header names are case-insensitive, so the
 * last duplicated header value wins, matching Axios header normalization.
 */
export function buildRequestHeaders(
	rows: KeyValueRow[],
	autoContentType?: string,
): Record<string, string> {
	const uniqueHeaders = new Map<string, KeyValueEntry>();

	for (const entry of toKeyValueEntries(rows)) {
		uniqueHeaders.set(entry.key.toLowerCase(), entry);
	}

	const headers: Record<string, string> = {};

	for (const entry of uniqueHeaders.values()) {
		headers[entry.key] = entry.value;
	}

	if (autoContentType && !uniqueHeaders.has("content-type")) {
		headers["Content-Type"] = autoContentType;
	}

	return headers;
}

/**
 * Validates and prepares the body. GET and HEAD never carry a body, and None
 * disables the body entirely, so their editor contents are not validated.
 */
export function buildRequestBody(draft: RequestDraft): RequestBodyBuildResult {
	if (draft.method === "GET" || draft.method === "HEAD") {
		return { ok: true };
	}

	if (draft.bodyType === "none") {
		return { ok: true };
	}

	if (draft.bodyType === "json") {
		try {
			JSON.parse(draft.body);
		} catch {
			return { ok: false, message: INVALID_JSON_MESSAGE };
		}

		return {
			ok: true,
			data: draft.body,
			contentType: "application/json",
		};
	}

	return {
		ok: true,
		data: draft.body,
		contentType: "text/plain",
	};
}

export function prepareRequest(
	draft: RequestDraft,
	{ pageProtocol }: PrepareRequestOptions = {},
): PrepareRequestResult {
	const urlResult = normalizeRequestUrl(draft.url);

	if (!urlResult.ok) {
		return urlResult;
	}

	const mixedContentIssue = getMixedContentIssue(urlResult.url, pageProtocol);

	if (mixedContentIssue) {
		return { ok: false, issue: mixedContentIssue };
	}

	const bodyResult = buildRequestBody(draft);

	if (!bodyResult.ok) {
		return {
			ok: false,
			issue: {
				code: "invalid-json",
				message: bodyResult.message,
			},
		};
	}

	return {
		ok: true,
		request: {
			method: draft.method,
			url: urlResult.url,
			params: buildQueryParams(draft.params),
			headers: buildRequestHeaders(draft.headers, bodyResult.contentType),
			...(bodyResult.data !== undefined ? { data: bodyResult.data } : {}),
		},
	};
}

function normalizeRequestUrl(rawUrl: string): RequestUrlResult {
	const trimmedUrl = rawUrl.trim();

	if (trimmedUrl === "") {
		return {
			ok: false,
			issue: { code: "empty-url", message: EMPTY_URL_MESSAGE },
		};
	}

	let parsedUrl: URL;

	try {
		parsedUrl = new URL(trimmedUrl);
	} catch {
		return {
			ok: false,
			issue: { code: "invalid-url", message: INVALID_URL_MESSAGE },
		};
	}

	if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
		return {
			ok: false,
			issue: {
				code: "unsupported-protocol",
				message: `Only HTTP and HTTPS URLs are supported (received "${parsedUrl.protocol}").`,
			},
		};
	}

	return { ok: true, url: parsedUrl.toString() };
}

function getMixedContentIssue(
	url: string,
	pageProtocol?: string,
): RequestValidationIssue | null {
	if (pageProtocol !== "https:" && pageProtocol !== "https") {
		return null;
	}

	const parsedUrl = new URL(url);

	if (parsedUrl.protocol !== "http:") {
		return null;
	}

	if (isLoopbackHost(parsedUrl.hostname)) {
		return null;
	}

	return {
		code: "mixed-content",
		message: MIXED_CONTENT_MESSAGE,
	};
}

function isLoopbackHost(hostname: string): boolean {
	return (
		hostname === "localhost" ||
		hostname.endsWith(".localhost") ||
		hostname === "127.0.0.1" ||
		hostname === "::1" ||
		hostname === "[::1]"
	);
}
