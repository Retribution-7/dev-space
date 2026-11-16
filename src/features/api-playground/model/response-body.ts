import type { HttpResponse } from "./types";

const INVALID_JSON_BODY_MESSAGE =
	"The response body is not valid JSON. The raw body is shown below.";
const BINARY_BODY_MESSAGE =
	"The response contains binary data and cannot be displayed as text.";
const UNSUPPORTED_BODY_MESSAGE =
	"This response format is not supported for preview.";

const TEXT_CONTENT_TYPES = new Set([
	"application/ecmascript",
	"application/graphql",
	"application/javascript",
	"application/ndjson",
	"application/sql",
	"application/x-httpd-php",
	"application/x-javascript",
	"application/x-ndjson",
	"application/x-www-form-urlencoded",
	"application/x-yaml",
	"application/yaml",
]);

const BINARY_CONTENT_TYPES = new Set([
	"application/avro",
	"application/gzip",
	"application/msgpack",
	"application/octet-stream",
	"application/pdf",
	"application/vnd.ms-excel",
	"application/vnd.oasis.opendocument.presentation",
	"application/vnd.oasis.opendocument.spreadsheet",
	"application/vnd.oasis.opendocument.text",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/wasm",
	"application/x-7z-compressed",
	"application/x-bzip2",
	"application/x-gzip",
	"application/x-msgpack",
	"application/x-protobuf",
	"application/x-rar-compressed",
	"application/x-tar",
	"application/zip",
]);

const HTML_DOCUMENT_PATTERN = /^<!doctype\s+html(?:\s|>)/i;
const HTML_ROOT_PATTERN = /^<html(?:\s|>)/i;
const XML_DOCUMENT_PATTERN = /^<\?xml(?:\s|>)/i;
const XML_ELEMENT_PATTERN = /^<[a-z][\w:.-]*(?:\s|>)/i;

export type ResponseBodyFormat =
	"json" | "html" | "xml" | "text" | "binary" | "unsupported";

type ResponseBodyBase = {
	contentType: string | null;
};

export type ResponseBodyView =
	| (ResponseBodyBase & { kind: "empty" })
	| (ResponseBodyBase & { kind: "json"; raw: string; pretty: string })
	| (ResponseBodyBase & {
			kind: "invalid-json";
			raw: string;
			message: string;
	  })
	| (ResponseBodyBase & { kind: "text"; raw: string })
	| (ResponseBodyBase & { kind: "html"; raw: string })
	| (ResponseBodyBase & { kind: "xml"; raw: string })
	| (ResponseBodyBase & { kind: "binary"; message: string })
	| (ResponseBodyBase & { kind: "unsupported"; message: string });

export function getResponseHeader(
	headers: Record<string, string>,
	name: string,
): string | null {
	const normalizedName = name.toLowerCase();

	for (const [headerName, headerValue] of Object.entries(headers)) {
		if (headerName.toLowerCase() === normalizedName) {
			return headerValue;
		}
	}

	return null;
}

export function getResponseContentType(
	headers: Record<string, string>,
): string | null {
	const headerValue = getResponseHeader(headers, "content-type");

	if (!headerValue) {
		return null;
	}

	const [contentType] = headerValue.split(";");

	return contentType?.trim().toLowerCase() || null;
}

export function detectResponseBodyFormat(
	headers: Record<string, string>,
	body: string,
): ResponseBodyFormat {
	const contentType = getResponseContentType(headers);

	if (contentType) {
		if (isJsonContentType(contentType)) {
			return "json";
		}

		if (isHtmlContentType(contentType)) {
			return "html";
		}

		if (isXmlContentType(contentType)) {
			return "xml";
		}

		if (isBinaryContentType(contentType)) {
			return "binary";
		}

		if (isTextContentType(contentType)) {
			return contentType === "text/plain" && formatJsonBody(body) !== null
				? "json"
				: "text";
		}

		const sniffedFormat = sniffStructuredFormat(body);

		if (sniffedFormat) {
			return sniffedFormat;
		}

		return "unsupported";
	}

	const sniffedFormat = sniffStructuredFormat(body);

	if (sniffedFormat) {
		return sniffedFormat;
	}

	return hasBinarySignals(body) ? "binary" : "text";
}

export function formatJsonBody(rawBody: string): string | null {
	try {
		const parsed: unknown = JSON.parse(rawBody);
		const formatted = JSON.stringify(parsed, null, 2);

		return formatted ?? null;
	} catch {
		return null;
	}
}

export function createResponseBodyView(
	response: Pick<HttpResponse, "headers" | "body">,
): ResponseBodyView {
	const contentType = getResponseContentType(response.headers);

	if (response.body.trim() === "") {
		return { kind: "empty", contentType };
	}

	const format = detectResponseBodyFormat(response.headers, response.body);

	switch (format) {
		case "json": {
			const pretty = formatJsonBody(response.body);

			if (pretty === null) {
				return {
					kind: "invalid-json",
					raw: response.body,
					message: INVALID_JSON_BODY_MESSAGE,
					contentType,
				};
			}

			return {
				kind: "json",
				raw: response.body,
				pretty,
				contentType,
			};
		}
		case "html":
			return { kind: "html", raw: response.body, contentType };
		case "xml":
			return { kind: "xml", raw: response.body, contentType };
		case "text":
			return { kind: "text", raw: response.body, contentType };
		case "binary":
			return {
				kind: "binary",
				message: BINARY_BODY_MESSAGE,
				contentType,
			};
		case "unsupported":
			return {
				kind: "unsupported",
				message: UNSUPPORTED_BODY_MESSAGE,
				contentType,
			};
	}
}

function isJsonContentType(contentType: string): boolean {
	return (
		contentType === "application/json" ||
		contentType === "text/json" ||
		contentType.endsWith("+json")
	);
}

function isHtmlContentType(contentType: string): boolean {
	return contentType === "text/html" || contentType === "application/xhtml+xml";
}

function isXmlContentType(contentType: string): boolean {
	return (
		contentType === "application/xml" ||
		contentType === "text/xml" ||
		(contentType.endsWith("+xml") && !isHtmlContentType(contentType))
	);
}

function isTextContentType(contentType: string): boolean {
	return contentType.startsWith("text/") || TEXT_CONTENT_TYPES.has(contentType);
}

function isBinaryContentType(contentType: string): boolean {
	return (
		contentType.startsWith("image/") ||
		contentType.startsWith("audio/") ||
		contentType.startsWith("video/") ||
		contentType.startsWith("font/") ||
		BINARY_CONTENT_TYPES.has(contentType)
	);
}

function sniffStructuredFormat(
	body: string,
): Exclude<ResponseBodyFormat, "binary" | "unsupported"> | null {
	const trimmedBody = body.trim();

	if (trimmedBody === "") {
		return null;
	}

	if (formatJsonBody(trimmedBody) !== null) {
		return "json";
	}

	if (
		HTML_DOCUMENT_PATTERN.test(trimmedBody) ||
		HTML_ROOT_PATTERN.test(trimmedBody)
	) {
		return "html";
	}

	if (
		XML_DOCUMENT_PATTERN.test(trimmedBody) ||
		XML_ELEMENT_PATTERN.test(trimmedBody)
	) {
		return "xml";
	}

	return null;
}

function hasBinarySignals(body: string): boolean {
	if (body.includes("\u0000")) {
		return true;
	}

	let suspiciousCharacters = 0;

	for (const character of body) {
		const codePoint = character.codePointAt(0) ?? 0;

		if (
			codePoint === 0xfffd ||
			(codePoint < 0x20 &&
				codePoint !== 0x09 &&
				codePoint !== 0x0a &&
				codePoint !== 0x0d)
		) {
			suspiciousCharacters += 1;
		}
	}

	return body.length > 0 && suspiciousCharacters / body.length > 0.1;
}
