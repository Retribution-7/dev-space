"use client";

import * as React from "react";

import {
	applySavedSnippet,
	closeTab as closeTabState,
	createNewTabId,
	createWorkspaceState,
	findTab,
	hasUnsavedChanges,
	openNewTab as openNewTabState,
	openSnippetTab as openSnippetTabState,
	removeSnippetTabs,
	saveNewTabAsSnippet,
	selectTab as selectTabState,
	type SnippetsWorkspaceState,
	updateTabDraft as updateTabDraftState,
} from "./snippets-workspace";
import type { Snippet, SnippetDraft } from "./types";
import { useSnippets } from "./use-snippets";

/**
 * Binds the shared snippets store with the local tab/draft workspace state.
 *
 * Saved snippets live in the shared store and are only changed by explicit
 * save actions; drafts stay local to their tabs until then.
 */
export function useSnippetsWorkspace() {
	const { snippets, createSnippet, updateSnippet, deleteSnippet } =
		useSnippets();
	const [state, setState] =
		React.useState<SnippetsWorkspaceState>(createWorkspaceState);

	const activeTab =
		state.tabs.find((tab) => tab.tabId === state.activeTabId) ?? null;

	function openSnippet(snippet: Snippet) {
		setState((current) => openSnippetTabState(current, snippet));
	}

	function createTab(): string {
		const tabId = createNewTabId();
		setState((current) => openNewTabState(current, tabId));
		return tabId;
	}

	function activateTab(tabId: string) {
		setState((current) => selectTabState(current, tabId));
	}

	function updateDraft(tabId: string, patch: Partial<SnippetDraft>) {
		setState((current) => updateTabDraftState(current, tabId, patch));
	}

	function closeTab(tabId: string) {
		setState((current) => closeTabState(current, tabId));
	}

	/** Saves a temporary tab as a brand new snippet and converts the tab. */
	function saveNewSnippet(tabId: string, metadata: SnippetDraft): Snippet {
		const tab = findTab(state, tabId);
		const draft: SnippetDraft = {
			...metadata,
			code: tab ? tab.draft.code : metadata.code,
		};
		const snippet = createSnippet(draft);
		setState((current) => saveNewTabAsSnippet(current, tabId, snippet));
		return snippet;
	}

	/** Persists the draft of a tab that already belongs to a snippet. */
	function saveTabChanges(tabId: string): Snippet {
		const tab = findTab(state, tabId);

		if (!tab || tab.snippetId === null) {
			throw new Error("This tab has no saved snippet yet.");
		}

		const snippet = updateSnippet(tab.snippetId, tab.draft);
		setState((current) => applySavedSnippet(current, snippet));
		return snippet;
	}

	function removeSnippet(snippetId: string) {
		deleteSnippet(snippetId);
		setState((current) => removeSnippetTabs(current, snippetId));
	}

	return {
		snippets,
		tabs: state.tabs,
		activeTab,
		activeTabId: state.activeTabId,
		hasUnsavedChanges: hasUnsavedChanges(state),
		openSnippet,
		createTab,
		activateTab,
		updateDraft,
		closeTab,
		saveNewSnippet,
		saveTabChanges,
		removeSnippet,
	};
}
