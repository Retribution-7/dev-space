import {
	cloneRequestDraft,
	createRequestDraft,
	type RequestDraftAction,
	requestDraftReducer,
} from "./request-draft";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "./request-timeout";
import type { RequestDraft } from "./types";

export type RequestTabKind = "new" | "collection" | "history";

export type OpenRequestTab = {
	id: string;
	kind: RequestTabKind;
	label?: string;
	draft: RequestDraft;
	baselineDraft: RequestDraft;
	timeoutMs: number;
};

export type RequestWorkspaceState = {
	tabs: OpenRequestTab[];
	activeTabId: string | null;
};

export type CreateOpenRequestTabInput = {
	id: string;
	kind: RequestTabKind;
	label?: string;
	draft?: RequestDraft;
	timeoutMs?: number;
};

export type RequestWorkspaceAction =
	| { type: "create-tab"; tab: OpenRequestTab }
	| { type: "close-tab"; id: string }
	| { type: "activate-tab"; id: string }
	| { type: "update-draft"; id: string; action: RequestDraftAction }
	| { type: "replace-draft"; id: string; draft: RequestDraft }
	| { type: "mark-saved"; id: string }
	| { type: "set-timeout"; id: string; timeoutMs: number };

export function createOpenRequestTab({
	id,
	kind,
	label,
	draft,
	timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
}: CreateOpenRequestTabInput): OpenRequestTab {
	const tabDraft = cloneRequestDraft(draft ?? createRequestDraft());

	return {
		id,
		kind,
		label,
		draft: tabDraft,
		baselineDraft: cloneRequestDraft(tabDraft),
		timeoutMs,
	};
}

export function createRequestWorkspaceState(): RequestWorkspaceState {
	const tab = createOpenRequestTab({ id: crypto.randomUUID(), kind: "new" });

	return {
		tabs: [tab],
		activeTabId: tab.id,
	};
}

export function getActiveRequestTab(
	state: RequestWorkspaceState,
): OpenRequestTab | null {
	return state.tabs.find((tab) => tab.id === state.activeTabId) ?? null;
}

export function isRequestTabDirty(tab: OpenRequestTab): boolean {
	return !isRequestDraftEqual(tab.draft, tab.baselineDraft);
}

export function getOpenRequestTabTitle(tab: OpenRequestTab): string {
	if (tab.label) {
		return tab.label;
	}

	const url = tab.draft.url.trim();

	if (url === "") {
		return "New Request";
	}

	try {
		const parsedUrl = new URL(url);

		return `${tab.draft.method} ${parsedUrl.pathname || "/"}`;
	} catch {
		return `${tab.draft.method} ${url}`;
	}
}

export function requestWorkspaceReducer(
	state: RequestWorkspaceState,
	action: RequestWorkspaceAction,
): RequestWorkspaceState {
	switch (action.type) {
		case "create-tab":
			return {
				tabs: [...state.tabs, action.tab],
				activeTabId: action.tab.id,
			};
		case "close-tab": {
			const tabIndex = state.tabs.findIndex((tab) => tab.id === action.id);

			if (tabIndex === -1) {
				return state;
			}

			const tabs = state.tabs.filter((tab) => tab.id !== action.id);

			if (tabs.length === 0) {
				const fallbackTab = createOpenRequestTab({
					id: crypto.randomUUID(),
					kind: "new",
				});

				return { tabs: [fallbackTab], activeTabId: fallbackTab.id };
			}

			const activeTabId =
				state.activeTabId === action.id
					? tabs[Math.min(tabIndex, tabs.length - 1)].id
					: state.activeTabId;

			return { tabs, activeTabId };
		}
		case "activate-tab":
			return state.tabs.some((tab) => tab.id === action.id)
				? { ...state, activeTabId: action.id }
				: state;
		case "update-draft": {
			const tab = state.tabs.find((item) => item.id === action.id);

			if (!tab) {
				return state;
			}

			return {
				...state,
				tabs: state.tabs.map((item) =>
					item.id === action.id
						? {
								...item,
								draft: requestDraftReducer(item.draft, action.action),
							}
						: item,
				),
			};
		}
		case "replace-draft": {
			const tab = state.tabs.find((item) => item.id === action.id);

			if (!tab) {
				return state;
			}

			return {
				...state,
				tabs: state.tabs.map((item) =>
					item.id === action.id
						? {
								...item,
								draft: cloneRequestDraft(action.draft),
								baselineDraft: cloneRequestDraft(action.draft),
							}
						: item,
				),
			};
		}
		case "mark-saved": {
			const tab = state.tabs.find((item) => item.id === action.id);

			if (!tab) {
				return state;
			}

			return {
				...state,
				tabs: state.tabs.map((item) =>
					item.id === action.id
						? { ...item, baselineDraft: cloneRequestDraft(item.draft) }
						: item,
				),
			};
		}
		case "set-timeout": {
			const tab = state.tabs.find((item) => item.id === action.id);

			if (!tab) {
				return state;
			}

			return {
				...state,
				tabs: state.tabs.map((item) =>
					item.id === action.id
						? { ...item, timeoutMs: action.timeoutMs }
						: item,
				),
			};
		}
	}
}

function isRequestDraftEqual(left: RequestDraft, right: RequestDraft): boolean {
	return (
		left.method === right.method &&
		left.url === right.url &&
		left.bodyType === right.bodyType &&
		left.body === right.body &&
		isRowsEqual(left.params, right.params) &&
		isRowsEqual(left.headers, right.headers)
	);
}

function isRowsEqual(
	left: RequestDraft["params"],
	right: RequestDraft["params"],
): boolean {
	return (
		left.length === right.length &&
		left.every(
			(row, index) =>
				row.id === right[index].id &&
				row.key === right[index].key &&
				row.value === right[index].value,
		)
	);
}
