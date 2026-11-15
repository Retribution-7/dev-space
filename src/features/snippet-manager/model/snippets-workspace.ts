import { createSnippetDraft } from "./snippet-draft";
import type { Snippet, SnippetDraft } from "./types";

export type SnippetTab = {
	tabId: string;
	snippetId: string | null;
	draft: SnippetDraft;
	savedSnapshot: SnippetDraft | null;
};

export type SnippetsWorkspaceState = {
	tabs: SnippetTab[];
	activeTabId: string | null;
};

export const UNTITLED_TAB_LABEL = "Untitled";

export function createWorkspaceState(): SnippetsWorkspaceState {
	return { tabs: [], activeTabId: null };
}

export function createNewTabId(): string {
	return `new:${crypto.randomUUID()}`;
}

function copyDraft(draft: SnippetDraft): SnippetDraft {
	return { ...draft, tags: [...draft.tags] };
}

function isSameDraft(first: SnippetDraft, second: SnippetDraft): boolean {
	return (
		first.title === second.title &&
		first.description === second.description &&
		first.code === second.code &&
		first.language === second.language &&
		first.tags.length === second.tags.length &&
		first.tags.every((tag, index) => tag === second.tags[index])
	);
}

export function isDraftEmpty(draft: SnippetDraft): boolean {
	return (
		draft.title.trim() === "" &&
		draft.description.trim() === "" &&
		draft.code === "" &&
		draft.language.trim() === "" &&
		draft.tags.length === 0
	);
}

/**
 * A tab is dirty when its draft differs from the last saved state.
 * New snippets count as unsaved work as soon as they hold any content.
 */
export function isTabDirty(tab: SnippetTab): boolean {
	if (tab.savedSnapshot === null) {
		return !isDraftEmpty(tab.draft);
	}

	return !isSameDraft(tab.draft, tab.savedSnapshot);
}

export function hasUnsavedChanges(state: SnippetsWorkspaceState): boolean {
	return state.tabs.some(isTabDirty);
}

export function getTabLabel(tab: SnippetTab): string {
	return tab.draft.title.trim() || UNTITLED_TAB_LABEL;
}

export function findTab(
	state: SnippetsWorkspaceState,
	tabId: string,
): SnippetTab | null {
	return state.tabs.find((tab) => tab.tabId === tabId) ?? null;
}

function pickNextActiveTab(
	tabs: SnippetTab[],
	removedIndex: number,
): SnippetTab | null {
	return tabs[removedIndex] ?? tabs[removedIndex - 1] ?? null;
}

function removeTabs(
	state: SnippetsWorkspaceState,
	shouldRemove: (tab: SnippetTab) => boolean,
): SnippetsWorkspaceState {
	const removedIndex = state.tabs.findIndex(shouldRemove);

	if (removedIndex === -1) {
		return state;
	}

	const tabs = state.tabs.filter((tab) => !shouldRemove(tab));

	if (
		state.activeTabId !== null &&
		tabs.some((tab) => tab.tabId === state.activeTabId)
	) {
		return { tabs, activeTabId: state.activeTabId };
	}

	const nextActiveTab = pickNextActiveTab(tabs, removedIndex);

	return { tabs, activeTabId: nextActiveTab ? nextActiveTab.tabId : null };
}

/**
 * Opens a saved snippet in a tab. Re-selecting an already open snippet
 * activates its existing tab instead of creating a duplicate.
 */
export function openSnippetTab(
	state: SnippetsWorkspaceState,
	snippet: Snippet,
): SnippetsWorkspaceState {
	const existingTab = state.tabs.find((tab) => tab.snippetId === snippet.id);

	if (existingTab) {
		return { ...state, activeTabId: existingTab.tabId };
	}

	const draft = createSnippetDraft(snippet);
	const tab: SnippetTab = {
		tabId: snippet.id,
		snippetId: snippet.id,
		draft: copyDraft(draft),
		savedSnapshot: copyDraft(draft),
	};

	return { tabs: [...state.tabs, tab], activeTabId: tab.tabId };
}

/**
 * Opens a new unsaved tab. Its temporary id is intentionally unrelated to
 * the id the snippet receives after saving.
 */
export function openNewTab(
	state: SnippetsWorkspaceState,
	tabId: string,
): SnippetsWorkspaceState {
	const tab: SnippetTab = {
		tabId,
		snippetId: null,
		draft: createSnippetDraft(),
		savedSnapshot: null,
	};

	return { tabs: [...state.tabs, tab], activeTabId: tabId };
}

export function selectTab(
	state: SnippetsWorkspaceState,
	tabId: string,
): SnippetsWorkspaceState {
	if (!state.tabs.some((tab) => tab.tabId === tabId)) {
		return state;
	}

	return { ...state, activeTabId: tabId };
}

export function updateTabDraft(
	state: SnippetsWorkspaceState,
	tabId: string,
	patch: Partial<SnippetDraft>,
): SnippetsWorkspaceState {
	return {
		...state,
		tabs: state.tabs.map((tab) =>
			tab.tabId === tabId
				? {
						...tab,
						draft: {
							...tab.draft,
							...patch,
							tags: patch.tags ? [...patch.tags] : [...tab.draft.tags],
						},
					}
				: tab,
		),
	};
}

export function closeTab(
	state: SnippetsWorkspaceState,
	tabId: string,
): SnippetsWorkspaceState {
	return removeTabs(state, (tab) => tab.tabId === tabId);
}

/**
 * Replaces a temporary tab with a full tab of the saved snippet and keeps it
 * active. The tab identity switches from the temporary id to the snippet id.
 */
export function saveNewTabAsSnippet(
	state: SnippetsWorkspaceState,
	tabId: string,
	snippet: Snippet,
): SnippetsWorkspaceState {
	if (!state.tabs.some((tab) => tab.tabId === tabId)) {
		return state;
	}

	const draft = createSnippetDraft(snippet);
	const tab: SnippetTab = {
		tabId: snippet.id,
		snippetId: snippet.id,
		draft: copyDraft(draft),
		savedSnapshot: copyDraft(draft),
	};

	const tabs = state.tabs.map((item) => (item.tabId === tabId ? tab : item));

	return {
		tabs,
		activeTabId: state.activeTabId === tabId ? tab.tabId : state.activeTabId,
	};
}

/**
 * Refreshes the tab of a saved snippet after its changes were persisted.
 */
export function applySavedSnippet(
	state: SnippetsWorkspaceState,
	snippet: Snippet,
): SnippetsWorkspaceState {
	return {
		...state,
		tabs: state.tabs.map((tab) => {
			if (tab.snippetId !== snippet.id) {
				return tab;
			}

			const draft = createSnippetDraft(snippet);

			return {
				...tab,
				tabId: snippet.id,
				draft: copyDraft(draft),
				savedSnapshot: copyDraft(draft),
			};
		}),
	};
}

export function removeSnippetTabs(
	state: SnippetsWorkspaceState,
	snippetId: string,
): SnippetsWorkspaceState {
	return removeTabs(state, (tab) => tab.snippetId === snippetId);
}
