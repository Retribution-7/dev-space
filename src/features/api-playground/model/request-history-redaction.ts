import type { RequestHistoryEntry } from "./request-history";
import type { KeyValueRow, RequestBodyType, RequestDraft } from "./types";

export const REDACTED_VALUE = "[redacted]";

const SENSITIVE_NAME_PATTERN =
	/(authorization|cookie|password|passwd|pwd|secret|token|api[-_]?key|credential|private[-_]?key|session)/i;

const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_PATTERN =
	/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const KEY_VALUE_SECRET_PATTERN =
	/((?:password|passwd|pwd|secret|token|api[-_]?key|access[-_]?token|refresh[-_]?token|client[-_]?secret)\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi;

export function isSensitiveHistoryName(name: string): boolean {
	return SENSITIVE_NAME_PATTERN.test(name);
}

export function redactSensitiveText(value: string): string {
	return value
		.replace(BEARER_TOKEN_PATTERN, `Bearer ${REDACTED_VALUE}`)
		.replace(JWT_PATTERN, REDACTED_VALUE)
		.replace(
			KEY_VALUE_SECRET_PATTERN,
			(_match, prefix: string) => `${prefix}${REDACTED_VALUE}`,
		);
}

export function redactHistoryRows(rows: KeyValueRow[]): KeyValueRow[] {
	return rows.map((row) => ({
		...row,
		value: isSensitiveHistoryName(row.key)
			? REDACTED_VALUE
			: redactSensitiveText(row.value),
	}));
}

export function redactHistoryUrl(url: string): string {
	try {
		const parsedUrl = new URL(url);

		for (const key of [...parsedUrl.searchParams.keys()]) {
			if (isSensitiveHistoryName(key)) {
				parsedUrl.searchParams.set(key, REDACTED_VALUE);
			}
		}

		return parsedUrl.toString();
	} catch {
		return redactSensitiveText(url);
	}
}

export function redactHistoryBody(
	body: string,
	bodyType: RequestBodyType,
): string {
	if (bodyType !== "json") {
		return redactSensitiveText(body);
	}

	let parsedBody: unknown;

	try {
		parsedBody = JSON.parse(body);
	} catch {
		return redactSensitiveText(body);
	}

	const redactedBody = redactJsonValue(parsedBody);
	const serializedRedacted = JSON.stringify(redactedBody);

	if (serializedRedacted === JSON.stringify(parsedBody)) {
		return body;
	}

	return serializedRedacted ?? body;
}

export function sanitizeRequestDraftForPersistence(
	draft: RequestDraft,
): RequestDraft {
	return {
		...draft,
		url: redactHistoryUrl(draft.url),
		params: redactHistoryRows(draft.params),
		headers: redactHistoryRows(draft.headers),
		body: redactHistoryBody(draft.body, draft.bodyType),
	};
}

export function sanitizeHistoryEntryForPersistence(
	entry: RequestHistoryEntry,
): RequestHistoryEntry {
	return {
		...entry,
		draft: sanitizeRequestDraftForPersistence(entry.draft),
		result: {
			...entry.result,
			message: entry.result.message
				? redactSensitiveText(entry.result.message)
				: entry.result.message,
		},
	};
}

function redactJsonValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(redactJsonValue);
	}

	if (typeof value === "object" && value !== null) {
		const redacted: Record<string, unknown> = {};

		for (const [key, nestedValue] of Object.entries(value)) {
			redacted[key] = isSensitiveHistoryName(key)
				? REDACTED_VALUE
				: redactJsonValue(nestedValue);
		}

		return redacted;
	}

	if (typeof value === "string") {
		return redactSensitiveText(value);
	}

	return value;
}
