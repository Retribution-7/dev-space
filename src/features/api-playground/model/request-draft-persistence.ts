import {
	HTTP_METHODS,
	type HttpMethod,
	type KeyValueRow,
	REQUEST_BODY_TYPES,
	type RequestBodyType,
	type RequestDraft,
} from "./types";

export function isStoredRecord(
	value: unknown,
): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeStoredRows(
	value: unknown,
	prefix: string,
): KeyValueRow[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const rows: KeyValueRow[] = [];

	for (const [index, entry] of value.entries()) {
		if (!isStoredRecord(entry)) {
			continue;
		}

		const id =
			typeof entry.id === "string" && entry.id.trim() !== ""
				? entry.id
				: `${prefix}-${index}`;
		const key = typeof entry.key === "string" ? entry.key : "";
		const rowValue = typeof entry.value === "string" ? entry.value : "";

		rows.push({ id, key, value: rowValue });
	}

	return rows;
}

/**
 * Validates and normalizes a stored request draft. Returns `null` when the
 * record cannot be restored safely.
 */
export function normalizeStoredRequestDraft(
	value: unknown,
): RequestDraft | null {
	if (!isStoredRecord(value)) {
		return null;
	}

	const method = HTTP_METHODS.find((item) => item === value.method);

	if (!method) {
		return null;
	}

	if (typeof value.url !== "string" || value.url.trim() === "") {
		return null;
	}

	const bodyType = REQUEST_BODY_TYPES.find((item) => item === value.bodyType);

	return {
		method: method as HttpMethod,
		url: value.url,
		params: normalizeStoredRows(value.params, "param"),
		headers: normalizeStoredRows(value.headers, "header"),
		bodyType: (bodyType ?? "none") as RequestBodyType,
		body: typeof value.body === "string" ? value.body : "",
	};
}
