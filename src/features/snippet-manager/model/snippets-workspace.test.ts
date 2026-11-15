import { describe, expect, it } from "bun:test";

import {
	applySavedSnippet,
	closeTab,
	createNewTabId,
	createWorkspaceState,
	findTab,
	getTabLabel,
	hasUnsavedChanges,
	isTabDirty,
	openNewTab,
	openSnippetTab,
	removeSnippetTabs,
	saveNewTabAsSnippet,
	selectTab,
	type SnippetsWorkspaceState,
	type SnippetTab,
	updateTabDraft,
} from "./snippets-workspace";
import type { Snippet } from "./types";

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
	return {
		id: "snippet-a",
		title: "Debounce hook",
		description: "Delays updates.",
		code: "const value = 1;",
		language: "TypeScript",
		tags: ["react"],
		createdAt: "2026-01-01T09:00:00.000Z",
		updatedAt: "2026-01-02T09:00:00.000Z",
		...overrides,
	};
}

function getTabOrThrow(
	state: SnippetsWorkspaceState,
	tabId: string,
): SnippetTab {
	const tab = findTab(state, tabId);

	if (!tab) {
		throw new Error(`Expected tab ${tabId} to be open.`);
	}

	return tab;
}

describe("openSnippetTab", () => {
	it("opens a saved snippet in a clean tab", () => {
		const snippet = makeSnippet();
		const state = openSnippetTab(createWorkspaceState(), snippet);

		expect(state.tabs).toHaveLength(1);
		expect(state.activeTabId).toBe(snippet.id);
		expect(state.tabs[0].snippetId).toBe(snippet.id);
		expect(state.tabs[0].draft.code).toBe(snippet.code);
		expect(isTabDirty(state.tabs[0])).toBe(false);
	});

	it("activates the existing tab instead of duplicating it", () => {
		const snippet = makeSnippet();
		let state = openSnippetTab(createWorkspaceState(), snippet);
		state = updateTabDraft(state, snippet.id, { code: "changed();" });
		state = openSnippetTab(state, snippet);

		expect(state.tabs).toHaveLength(1);
		expect(state.activeTabId).toBe(snippet.id);
		expect(state.tabs[0].draft.code).toBe("changed();");
	});
});

describe("openNewTab", () => {
	it("creates several unsaved tabs with distinct temporary ids", () => {
		let state = openNewTab(createWorkspaceState(), createNewTabId());
		state = openNewTab(state, createNewTabId());

		expect(state.tabs).toHaveLength(2);
		expect(state.tabs[0].tabId).not.toBe(state.tabs[1].tabId);
		expect(state.tabs.every((tab) => tab.snippetId === null)).toBe(true);
		expect(state.tabs[0].tabId.startsWith("new:")).toBe(true);
	});

	it("creates an empty tab labelled Untitled", () => {
		const state = openNewTab(createWorkspaceState(), "new:1");

		expect(getTabLabel(state.tabs[0])).toBe("Untitled");
		expect(state.activeTabId).toBe("new:1");
		expect(isTabDirty(state.tabs[0])).toBe(false);
	});
});

describe("selectTab", () => {
	it("switches between open tabs", () => {
		const snippet = makeSnippet();
		let state = openSnippetTab(createWorkspaceState(), snippet);
		state = openNewTab(state, "new:1");
		state = selectTab(state, snippet.id);

		expect(state.activeTabId).toBe(snippet.id);
		expect(state.tabs).toHaveLength(2);
	});

	it("ignores unknown tab ids", () => {
		const snippet = makeSnippet();
		const state = openSnippetTab(createWorkspaceState(), snippet);

		expect(selectTab(state, "missing")).toEqual(state);
	});
});

describe("updateTabDraft", () => {
	it("keeps changes local to their tab", () => {
		const snippet = makeSnippet();
		let state = openSnippetTab(createWorkspaceState(), snippet);
		state = openNewTab(state, "new:1");
		state = updateTabDraft(state, snippet.id, { code: "typed();" });

		expect(findTab(state, snippet.id)?.draft.code).toBe("typed();");
		expect(findTab(state, "new:1")?.draft.code).toBe("");
	});
});

describe("saveNewTabAsSnippet", () => {
	it("replaces the temporary tab with the saved snippet tab", () => {
		const snippet = makeSnippet();
		let state = openSnippetTab(createWorkspaceState(), snippet);
		state = openNewTab(state, "new:1");
		state = updateTabDraft(state, "new:1", { code: "const saved = true;" });

		const created = makeSnippet({
			id: "snippet-b",
			title: "Saved snippet",
			code: "const saved = true;",
		});
		state = saveNewTabAsSnippet(state, "new:1", created);

		expect(state.tabs.map((tab) => tab.tabId)).toEqual([
			"snippet-a",
			"snippet-b",
		]);
		expect(state.activeTabId).toBe("snippet-b");

		const tab = getTabOrThrow(state, "snippet-b");
		expect(tab.snippetId).toBe("snippet-b");
		expect(tab.draft.title).toBe("Saved snippet");
		expect(tab.savedSnapshot?.code).toBe("const saved = true;");
		expect(isTabDirty(tab)).toBe(false);
	});

	it("keeps the converted tab clean after the code was typed", () => {
		let state = openNewTab(createWorkspaceState(), "new:1");
		state = updateTabDraft(state, "new:1", { code: "typed();" });
		expect(isTabDirty(getTabOrThrow(state, "new:1"))).toBe(true);

		state = saveNewTabAsSnippet(
			state,
			"new:1",
			makeSnippet({ id: "snippet-b", code: "typed();" }),
		);

		expect(isTabDirty(getTabOrThrow(state, "snippet-b"))).toBe(false);
	});
});

describe("applySavedSnippet", () => {
	it("clears the unsaved state after saving changes", () => {
		const snippet = makeSnippet();
		let state = openSnippetTab(createWorkspaceState(), snippet);
		state = updateTabDraft(state, snippet.id, {
			title: "Renamed hook",
			code: "const value = 2;",
		});
		expect(hasUnsavedChanges(state)).toBe(true);

		state = applySavedSnippet(
			state,
			makeSnippet({
				title: "Renamed hook",
				code: "const value = 2;",
				updatedAt: "2026-02-02T09:00:00.000Z",
			}),
		);

		const tab = getTabOrThrow(state, snippet.id);
		expect(isTabDirty(tab)).toBe(false);
		expect(tab.draft.title).toBe("Renamed hook");
		expect(tab.savedSnapshot).toEqual(tab.draft);
		expect(hasUnsavedChanges(state)).toBe(false);
	});
});

describe("isTabDirty", () => {
	it("detects unsaved changes in code, metadata, and tags", () => {
		const snippet = makeSnippet();
		const cleanState = openSnippetTab(createWorkspaceState(), snippet);

		expect(isTabDirty(cleanState.tabs[0])).toBe(false);
		expect(
			isTabDirty(updateTabDraft(cleanState, snippet.id, { code: "x" }).tabs[0]),
		).toBe(true);
		expect(
			isTabDirty(
				updateTabDraft(cleanState, snippet.id, { title: "Other" }).tabs[0],
			),
		).toBe(true);
		expect(
			isTabDirty(
				updateTabDraft(cleanState, snippet.id, { tags: ["ui"] }).tabs[0],
			),
		).toBe(true);
	});

	it("treats a reverted draft as clean again", () => {
		const snippet = makeSnippet();
		let state = openSnippetTab(createWorkspaceState(), snippet);
		state = updateTabDraft(state, snippet.id, { code: "typed();" });
		state = updateTabDraft(state, snippet.id, { code: snippet.code });

		expect(isTabDirty(getTabOrThrow(state, snippet.id))).toBe(false);
	});

	it("treats a new tab as unsaved once it holds content", () => {
		let state = openNewTab(createWorkspaceState(), "new:1");
		expect(isTabDirty(state.tabs[0])).toBe(false);

		state = updateTabDraft(state, "new:1", { code: "typed();" });
		expect(isTabDirty(state.tabs[0])).toBe(true);
		expect(hasUnsavedChanges(state)).toBe(true);
	});
});

describe("closeTab", () => {
	it("closes a clean tab without any confirmation", () => {
		const snippet = makeSnippet();
		const state = openSnippetTab(createWorkspaceState(), snippet);

		expect(isTabDirty(state.tabs[0])).toBe(false);

		const closed = closeTab(state, snippet.id);

		expect(closed.tabs).toEqual([]);
		expect(closed.activeTabId).toBeNull();
	});

	it("keeps a modified tab open until the close is confirmed", () => {
		const snippet = makeSnippet();
		let state = openSnippetTab(createWorkspaceState(), snippet);
		state = updateTabDraft(state, snippet.id, { code: "typed();" });

		// The UI asks for confirmation because the tab is dirty; the draft is
		// still there when the user chooses to keep editing.
		expect(isTabDirty(getTabOrThrow(state, snippet.id))).toBe(true);
		expect(getTabOrThrow(state, snippet.id).draft.code).toBe("typed();");
	});

	it("activates the right neighbour after closing the active tab", () => {
		let state = openNewTab(createWorkspaceState(), "new:1");
		state = openNewTab(state, "new:2");
		state = openNewTab(state, "new:3");
		state = selectTab(state, "new:2");

		expect(closeTab(state, "new:2").activeTabId).toBe("new:3");
	});

	it("falls back to the left neighbour at the end of the list", () => {
		let state = openNewTab(createWorkspaceState(), "new:1");
		state = openNewTab(state, "new:2");

		expect(closeTab(state, "new:2").activeTabId).toBe("new:1");
	});

	it("keeps the active tab when a different tab is closed", () => {
		let state = openNewTab(createWorkspaceState(), "new:1");
		state = openNewTab(state, "new:2");
		state = selectTab(state, "new:1");

		expect(closeTab(state, "new:2").activeTabId).toBe("new:1");
	});
});

describe("removeSnippetTabs", () => {
	it("closes tabs of a deleted snippet and keeps other drafts", () => {
		const deleted = makeSnippet();
		const kept = makeSnippet({ id: "snippet-b", title: "Kept" });
		let state = openSnippetTab(createWorkspaceState(), deleted);
		state = openSnippetTab(state, kept);
		state = updateTabDraft(state, kept.id, { code: "untouched();" });
		state = selectTab(state, deleted.id);

		state = removeSnippetTabs(state, deleted.id);

		expect(state.tabs.map((tab) => tab.tabId)).toEqual([kept.id]);
		expect(state.activeTabId).toBe(kept.id);
		expect(findTab(state, kept.id)?.draft.code).toBe("untouched();");
		expect(hasUnsavedChanges(state)).toBe(true);
	});

	it("does nothing for snippets without open tabs", () => {
		const snippet = makeSnippet();
		const state = openSnippetTab(createWorkspaceState(), snippet);

		expect(removeSnippetTabs(state, "missing")).toEqual(state);
	});
});
