import { describe, expect, it } from "bun:test";

import { createRequestDraft } from "./request-draft";
import {
	createOpenRequestTab,
	createRequestWorkspaceState,
	getActiveRequestTab,
	getOpenRequestTabTitle,
	isRequestTabDirty,
	requestWorkspaceReducer,
	type RequestWorkspaceState,
} from "./request-workspace";
import type { RequestDraft } from "./types";

function createDraft(overrides: Partial<RequestDraft> = {}): RequestDraft {
	return {
		...createRequestDraft(),
		method: "GET",
		url: "https://api.example.com/users",
		...overrides,
	};
}

function createState(
	tabs = [createOpenRequestTab({ id: "tab-1", kind: "new" })],
): RequestWorkspaceState {
	return {
		tabs,
		activeTabId: tabs[0]?.id ?? null,
	};
}

describe("requestWorkspaceReducer", () => {
	it("starts with one new request tab", () => {
		const state = createRequestWorkspaceState();

		expect(state.tabs).toHaveLength(1);
		expect(state.tabs[0].kind).toBe("new");
		expect(state.activeTabId).toBe(state.tabs[0].id);
	});

	it("creates and activates new tabs", () => {
		const state = createState();
		const next = requestWorkspaceReducer(state, {
			type: "create-tab",
			tab: createOpenRequestTab({ id: "tab-2", kind: "collection" }),
		});

		expect(next.tabs.map((tab) => tab.id)).toEqual(["tab-1", "tab-2"]);
		expect(next.activeTabId).toBe("tab-2");
	});

	it("keeps draft state independent between tabs", () => {
		const state = createState([
			createOpenRequestTab({ id: "tab-1", kind: "new" }),
			createOpenRequestTab({ id: "tab-2", kind: "new" }),
		]);
		const next = requestWorkspaceReducer(state, {
			type: "update-draft",
			id: "tab-1",
			action: { type: "set-url", url: "https://api.example.com/one" },
		});

		expect(next.tabs[0].draft.url).toBe("https://api.example.com/one");
		expect(next.tabs[1].draft.url).toBe("");
		expect(state.tabs[0].draft.url).toBe("");
	});

	it("replaces a tab draft without touching other tabs", () => {
		const restored = createDraft({ url: "https://api.example.com/restored" });
		const state = createState([
			createOpenRequestTab({ id: "tab-1", kind: "new" }),
			createOpenRequestTab({ id: "tab-2", kind: "new" }),
		]);
		const next = requestWorkspaceReducer(state, {
			type: "replace-draft",
			id: "tab-1",
			draft: restored,
		});

		expect(next.tabs[0].draft.url).toBe("https://api.example.com/restored");
		expect(next.tabs[1].draft.url).toBe("");
		expect(isRequestTabDirty(next.tabs[0])).toBe(false);
	});

	it("tracks unsaved changes and clears them when marked saved", () => {
		let state = createState([
			createOpenRequestTab({
				id: "tab-1",
				kind: "collection",
				draft: createDraft(),
			}),
		]);

		expect(isRequestTabDirty(state.tabs[0])).toBe(false);

		state = requestWorkspaceReducer(state, {
			type: "update-draft",
			id: "tab-1",
			action: { type: "set-url", url: "https://api.example.com/changed" },
		});

		expect(isRequestTabDirty(state.tabs[0])).toBe(true);

		state = requestWorkspaceReducer(state, { type: "mark-saved", id: "tab-1" });

		expect(isRequestTabDirty(state.tabs[0])).toBe(false);
	});

	it("stores an independent timeout per tab", () => {
		const state = createState([
			createOpenRequestTab({ id: "tab-1", kind: "new" }),
			createOpenRequestTab({ id: "tab-2", kind: "new" }),
		]);
		const next = requestWorkspaceReducer(state, {
			type: "set-timeout",
			id: "tab-2",
			timeoutMs: 60_000,
		});

		expect(next.tabs[0].timeoutMs).toBe(30_000);
		expect(next.tabs[1].timeoutMs).toBe(60_000);
	});

	it("activates a neighboring tab when one is closed", () => {
		const state = createState([
			createOpenRequestTab({ id: "tab-1", kind: "new" }),
			createOpenRequestTab({ id: "tab-2", kind: "new" }),
			createOpenRequestTab({ id: "tab-3", kind: "new" }),
		]);
		const next = requestWorkspaceReducer(
			{ ...state, activeTabId: "tab-2" },
			{ type: "close-tab", id: "tab-2" },
		);

		expect(next.tabs.map((tab) => tab.id)).toEqual(["tab-1", "tab-3"]);
		expect(next.activeTabId).toBe("tab-3");
	});

	it("creates a fresh tab when the last one is closed", () => {
		const state = createState([
			createOpenRequestTab({ id: "tab-1", kind: "new" }),
		]);
		const next = requestWorkspaceReducer(state, {
			type: "close-tab",
			id: "tab-1",
		});

		expect(next.tabs).toHaveLength(1);
		expect(next.tabs[0].id).not.toBe("tab-1");
		expect(next.activeTabId).toBe(next.tabs[0].id);
	});

	it("ignores unknown tabs", () => {
		const state = createState();

		expect(
			requestWorkspaceReducer(state, { type: "activate-tab", id: "missing" }),
		).toBe(state);
		expect(
			requestWorkspaceReducer(state, {
				type: "update-draft",
				id: "missing",
				action: { type: "set-url", url: "https://api.example.com" },
			}),
		).toBe(state);
	});
});

describe("request tab helpers", () => {
	it("returns the active tab", () => {
		const state = createState([
			createOpenRequestTab({ id: "tab-1", kind: "new" }),
			createOpenRequestTab({ id: "tab-2", kind: "new" }),
		]);

		expect(getActiveRequestTab({ ...state, activeTabId: "tab-2" })?.id).toBe(
			"tab-2",
		);
		expect(getActiveRequestTab({ ...state, activeTabId: null })).toBeNull();
	});

	it("derives readable tab titles", () => {
		expect(
			getOpenRequestTabTitle(
				createOpenRequestTab({ id: "tab-1", kind: "new" }),
			),
		).toBe("New Request");
		expect(
			getOpenRequestTabTitle(
				createOpenRequestTab({
					id: "tab-2",
					kind: "collection",
					label: "Create user",
					draft: createDraft(),
				}),
			),
		).toBe("Create user");
		expect(
			getOpenRequestTabTitle(
				createOpenRequestTab({
					id: "tab-3",
					kind: "new",
					draft: createDraft({ url: "https://api.example.com/users" }),
				}),
			),
		).toBe("GET /users");
	});
});
