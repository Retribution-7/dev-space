import type {
	HttpMethod,
	KeyValueEntry,
	KeyValueField,
	KeyValueRow,
	KeyValueSection,
	RequestBodyType,
	RequestDraft,
} from "./types";

export function createRequestDraft(): RequestDraft {
	return {
		method: "GET",
		url: "",
		params: [],
		headers: [],
		bodyType: "none",
		body: "",
	};
}

/**
 * Returns the key/value pairs that will take part in the request.
 * Rows without a key and completely blank rows are ignored.
 */
export function toKeyValueEntries(rows: KeyValueRow[]): KeyValueEntry[] {
	return rows
		.filter((row) => row.key.trim() !== "")
		.map((row) => ({ key: row.key.trim(), value: row.value.trim() }));
}

export function getFilledRowCount(rows: KeyValueRow[]): number {
	return toKeyValueEntries(rows).length;
}

export type RequestDraftAction =
	| { type: "set-method"; method: HttpMethod }
	| { type: "set-url"; url: string }
	| { type: "add-row"; section: KeyValueSection; id: string }
	| {
			type: "update-row";
			section: KeyValueSection;
			id: string;
			field: KeyValueField;
			value: string;
	  }
	| { type: "remove-row"; section: KeyValueSection; id: string }
	| { type: "set-body-type"; bodyType: RequestBodyType }
	| { type: "set-body"; body: string };

export function requestDraftReducer(
	state: RequestDraft,
	action: RequestDraftAction,
): RequestDraft {
	switch (action.type) {
		case "set-method":
			return { ...state, method: action.method };
		case "set-url":
			return { ...state, url: action.url };
		case "add-row":
			return {
				...state,
				[action.section]: [
					...state[action.section],
					{ id: action.id, key: "", value: "" },
				],
			};
		case "update-row": {
			const rows = state[action.section];

			if (!rows.some((row) => row.id === action.id)) {
				return state;
			}

			return {
				...state,
				[action.section]: rows.map((row) =>
					row.id === action.id ? { ...row, [action.field]: action.value } : row,
				),
			};
		}
		case "remove-row": {
			const rows = state[action.section];
			const nextRows = rows.filter((row) => row.id !== action.id);

			return nextRows.length === rows.length
				? state
				: { ...state, [action.section]: nextRows };
		}
		case "set-body-type":
			return { ...state, bodyType: action.bodyType };
		case "set-body":
			return { ...state, body: action.body };
	}
}
