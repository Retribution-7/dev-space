"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { isTabDirty } from "../../model/snippets-workspace";
import type { Snippet, SnippetDraft } from "../../model/types";
import { useSnippetsHydration } from "../../model/use-snippets";
import { useSnippetsWorkspace } from "../../model/use-snippets-workspace";
import { ConfirmDialog } from "../confirm-dialog";
import { FeedbackBanner, type WorkspaceFeedback } from "../feedback-banner";

import { SnippetEditorPanel } from "./snippet-editor-panel";
import { SnippetMetadataDialog } from "./snippet-metadata-dialog";
import { SnippetSidebar } from "./snippet-sidebar";
import { SnippetTabBar } from "./snippet-tab-bar";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";
import {
	useBeforeUnloadGuard,
	useUnsavedNavigationGuard,
} from "./use-unsaved-changes-guard";

type PendingAction =
	{ type: "close-tab"; tabId: string } | { type: "navigate"; href: string };

type MetadataDialogState = {
	mode: "create" | "edit";
	tabId: string;
	open: boolean;
	session: number;
};

function errorMessage(error: unknown): string {
	return error instanceof Error
		? error.message
		: "Something went wrong. Please try again.";
}

export function SnippetWorkspace() {
	const router = useRouter();
	const isHydrated = useSnippetsHydration();
	const workspace = useSnippetsWorkspace();
	const [feedback, setFeedback] = React.useState<WorkspaceFeedback | null>(
		null,
	);
	const [deleteTarget, setDeleteTarget] = React.useState<Snippet | null>(null);
	const [metadataDialog, setMetadataDialog] =
		React.useState<MetadataDialogState | null>(null);
	const [pendingAction, setPendingAction] =
		React.useState<PendingAction | null>(null);

	const dirtyTabs = workspace.tabs.filter(isTabDirty);
	const hasUnsavedChanges = dirtyTabs.length > 0;
	const metadataTab = metadataDialog
		? (workspace.tabs.find((tab) => tab.tabId === metadataDialog.tabId) ?? null)
		: null;
	const isMetadataDialogOpen = metadataDialog?.open === true;
	const unsavedTargetTab =
		pendingAction?.type === "close-tab"
			? (workspace.tabs.find((tab) => tab.tabId === pendingAction.tabId) ??
				null)
			: (dirtyTabs[0] ?? null);
	const isUnsavedDialogOpen =
		pendingAction !== null && hasUnsavedChanges && !isMetadataDialogOpen;
	const deleteTargetTab = deleteTarget
		? (workspace.tabs.find((tab) => tab.snippetId === deleteTarget.id) ?? null)
		: null;

	useBeforeUnloadGuard(hasUnsavedChanges);
	useUnsavedNavigationGuard(hasUnsavedChanges, (href) => {
		setPendingAction({ type: "navigate", href });
	});

	function executePendingAction(action: PendingAction) {
		setPendingAction(null);

		if (action.type === "close-tab") {
			workspace.closeTab(action.tabId);
			return;
		}

		void router.push(action.href);
	}

	function openMetadataDialog(mode: "create" | "edit", tabId: string) {
		setMetadataDialog((current) => ({
			mode,
			tabId,
			open: true,
			session: (current?.session ?? 0) + 1,
		}));
	}

	function closeMetadataDialog() {
		setMetadataDialog((current) =>
			current ? { ...current, open: false } : current,
		);
	}

	function handleCreateSnippet() {
		setFeedback(null);
		workspace.createTab();
	}

	function handleSelectSnippet(snippet: Snippet) {
		setFeedback(null);
		workspace.openSnippet(snippet);
	}

	function handleCodeChange(code: string) {
		if (workspace.activeTabId) {
			workspace.updateDraft(workspace.activeTabId, { code });
		}
	}

	function handleSave() {
		const tab = workspace.activeTab;

		if (!tab) {
			return;
		}

		setFeedback(null);

		if (tab.snippetId === null) {
			openMetadataDialog("create", tab.tabId);
			return;
		}

		try {
			const snippet = workspace.saveTabChanges(tab.tabId);
			setFeedback({
				status: "success",
				message: `"${snippet.title}" was updated.`,
			});
		} catch (error) {
			setFeedback({ status: "error", message: errorMessage(error) });
		}
	}

	function handleEditMetadata() {
		const tab = workspace.activeTab;

		if (!tab) {
			return;
		}

		setFeedback(null);
		openMetadataDialog("edit", tab.tabId);
	}

	function handleMetadataSubmit(draft: SnippetDraft) {
		if (!metadataDialog) {
			return;
		}

		const { mode, tabId } = metadataDialog;

		if (mode === "edit") {
			workspace.updateDraft(tabId, {
				title: draft.title,
				description: draft.description,
				language: draft.language,
				tags: draft.tags,
			});
			closeMetadataDialog();
			return;
		}

		const snippet = workspace.saveNewSnippet(tabId, draft);

		setFeedback({
			status: "success",
			message: `"${snippet.title}" was created.`,
		});
		closeMetadataDialog();

		if (!pendingAction) {
			return;
		}

		if (pendingAction.type === "close-tab") {
			if (pendingAction.tabId === tabId) {
				// The temporary tab became the saved snippet tab.
				executePendingAction({ type: "close-tab", tabId: snippet.id });
			}

			return;
		}

		const remainingNewTabs = workspace.tabs.filter(
			(tab) => tab.tabId !== tabId && tab.snippetId === null && isTabDirty(tab),
		);

		if (remainingNewTabs.length > 0) {
			openMetadataDialog("create", remainingNewTabs[0].tabId);
			return;
		}

		executePendingAction(pendingAction);
	}

	function handleCloseTabRequest(tabId: string) {
		const tab = workspace.tabs.find((item) => item.tabId === tabId) ?? null;

		if (tab && isTabDirty(tab)) {
			setPendingAction({ type: "close-tab", tabId });
			return;
		}

		workspace.closeTab(tabId);
	}

	function handleUnsavedSave() {
		const action = pendingAction;

		if (!action) {
			return;
		}

		if (action.type === "close-tab") {
			const tab =
				workspace.tabs.find((item) => item.tabId === action.tabId) ?? null;

			if (!tab) {
				setPendingAction(null);
				return;
			}

			if (tab.snippetId === null) {
				openMetadataDialog("create", tab.tabId);
				return;
			}

			try {
				const snippet = workspace.saveTabChanges(tab.tabId);
				workspace.closeTab(tab.tabId);
				setFeedback({
					status: "success",
					message: `"${snippet.title}" was updated.`,
				});
			} catch (error) {
				setFeedback({ status: "error", message: errorMessage(error) });
			}

			setPendingAction(null);
			return;
		}

		try {
			for (const tab of dirtyTabs) {
				if (tab.snippetId !== null) {
					workspace.saveTabChanges(tab.tabId);
				}
			}
		} catch (error) {
			setFeedback({ status: "error", message: errorMessage(error) });
			setPendingAction(null);
			return;
		}

		const newTab = dirtyTabs.find((tab) => tab.snippetId === null);

		if (newTab) {
			openMetadataDialog("create", newTab.tabId);
			return;
		}

		setFeedback({
			status: "success",
			message: "Your changes were saved.",
		});
		executePendingAction(action);
	}

	function handleUnsavedDiscard() {
		const action = pendingAction;

		if (!action) {
			return;
		}

		setPendingAction(null);

		if (action.type === "close-tab") {
			workspace.closeTab(action.tabId);
			return;
		}

		void router.push(action.href);
	}

	function handleDeleteRequest(snippet: Snippet) {
		setFeedback(null);
		setDeleteTarget(snippet);
	}

	function handleDeleteConfirm() {
		if (!deleteTarget) {
			return;
		}

		try {
			workspace.removeSnippet(deleteTarget.id);
			setFeedback({
				status: "success",
				message: `"${deleteTarget.title}" was deleted.`,
			});
		} catch (error) {
			setFeedback({ status: "error", message: errorMessage(error) });
		} finally {
			setDeleteTarget(null);
		}
	}

	return (
		<div className="flex flex-col gap-3">
			{feedback ? <FeedbackBanner feedback={feedback} /> : null}

			<div className="bg-card flex h-[min(75vh,44rem)] min-h-[30rem] flex-col overflow-hidden rounded-xl border shadow-xs lg:flex-row">
				<SnippetSidebar
					snippets={workspace.snippets}
					activeSnippetId={workspace.activeTab?.snippetId ?? null}
					isLoading={!isHydrated}
					onSelect={handleSelectSnippet}
					onCreate={handleCreateSnippet}
					onDelete={handleDeleteRequest}
				/>

				<div className="flex min-w-0 flex-1 flex-col">
					<SnippetTabBar
						tabs={workspace.tabs}
						activeTabId={workspace.activeTabId}
						onSelect={workspace.activateTab}
						onClose={handleCloseTabRequest}
					/>

					<SnippetEditorPanel
						tab={workspace.activeTab}
						onCodeChange={handleCodeChange}
						onSave={handleSave}
						onEditMetadata={handleEditMetadata}
						onDelete={() => {
							const tab = workspace.activeTab;

							if (tab?.snippetId) {
								const snippet = workspace.snippets.find(
									(item) => item.id === tab.snippetId,
								);

								if (snippet) {
									handleDeleteRequest(snippet);
								}
							}
						}}
						onCreate={handleCreateSnippet}
					/>
				</div>
			</div>

			{metadataDialog && metadataTab ? (
				<SnippetMetadataDialog
					key={metadataDialog.session}
					open={metadataDialog.open}
					mode={metadataDialog.mode}
					draft={metadataTab.draft}
					onOpenChange={(open) => {
						if (!open) {
							closeMetadataDialog();
						}
					}}
					onSubmit={handleMetadataSubmit}
				/>
			) : null}

			<UnsavedChangesDialog
				open={isUnsavedDialogOpen}
				title={
					pendingAction?.type === "close-tab"
						? "Close with unsaved changes?"
						: "Leave with unsaved changes?"
				}
				description={
					unsavedTargetTab ? (
						<>
							<span className="text-foreground font-medium">
								{unsavedTargetTab.draft.title.trim() || "Untitled"}
							</span>{" "}
							{pendingAction?.type === "close-tab"
								? "has unsaved changes that will be lost if you close this tab."
								: "and possibly other tabs have unsaved changes that will be lost if you leave this page."}
						</>
					) : (
						"You have unsaved changes that will be lost."
					)
				}
				onOpenChange={(open) => {
					if (!open) {
						setPendingAction(null);
					}
				}}
				onSave={handleUnsavedSave}
				onDiscard={handleUnsavedDiscard}
			/>

			<ConfirmDialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTarget(null);
					}
				}}
				title="Delete snippet?"
				description={
					deleteTarget ? (
						<>
							<span className="text-foreground font-medium">
								{deleteTarget.title}
							</span>{" "}
							will be permanently deleted. This action cannot be undone.
							{deleteTargetTab && isTabDirty(deleteTargetTab) ? (
								<span className="text-destructive mt-2 block">
									This snippet has unsaved changes in an open tab that will be
									lost.
								</span>
							) : null}
						</>
					) : (
						"This snippet will be permanently deleted."
					)
				}
				confirmLabel="Delete"
				onConfirm={handleDeleteConfirm}
				destructive
			/>
		</div>
	);
}
