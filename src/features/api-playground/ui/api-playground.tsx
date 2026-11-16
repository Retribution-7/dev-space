"use client";

import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";

import {
	cloneRequestDraft,
	createRequestDraft,
	type RequestDraftAction,
} from "../model/request-draft";
import {
	createOpenRequestTab,
	createRequestWorkspaceState,
	getActiveRequestTab,
	requestWorkspaceReducer,
} from "../model/request-workspace";
import type { RequestDraft } from "../model/types";

import { HistoryPanel } from "./history-panel";
import { RequestTabsBar } from "./request-tabs-bar";
import { RequestWorkspaceTab } from "./request-workspace-tab";
import { WorkspaceSidebar } from "./workspace-sidebar";

export function ApiPlayground() {
	const [workspace, dispatchWorkspace] = React.useReducer(
		requestWorkspaceReducer,
		undefined,
		createRequestWorkspaceState,
	);
	const activeTab = getActiveRequestTab(workspace);
	const isMobile = useIsMobile();
	const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

	function handleToggleSidebar() {
		if (isMobile) {
			setIsMobileSidebarOpen((open) => !open);
		} else {
			setIsSidebarOpen((open) => !open);
		}
	}

	function handleCreateTab() {
		dispatchWorkspace({
			type: "create-tab",
			tab: createOpenRequestTab({ id: crypto.randomUUID(), kind: "new" }),
		});
	}

	function handleOpenRequest(draft: RequestDraft) {
		dispatchWorkspace({
			type: "create-tab",
			tab: createOpenRequestTab({
				id: crypto.randomUUID(),
				kind: "collection",
				draft: cloneRequestDraft(draft),
			}),
		});
	}

	function handleDraftAction(id: string, action: RequestDraftAction) {
		dispatchWorkspace({ type: "update-draft", id, action });
	}

	function handleTimeoutChange(id: string, timeoutMs: number) {
		dispatchWorkspace({ type: "set-timeout", id, timeoutMs });
	}

	function handleMarkActiveSaved() {
		if (activeTab) {
			dispatchWorkspace({ type: "mark-saved", id: activeTab.id });
		}
	}

	return (
		<div className="flex flex-1 flex-col gap-4">
			<div className="bg-card flex items-stretch overflow-hidden rounded-xl border shadow-xs">
				<WorkspaceSidebar
					isMobile={isMobile}
					open={isMobile ? isMobileSidebarOpen : isSidebarOpen}
					onOpenChange={isMobile ? setIsMobileSidebarOpen : setIsSidebarOpen}
					draft={activeTab?.draft ?? createRequestDraft()}
					onOpenRequest={handleOpenRequest}
					onSaved={handleMarkActiveSaved}
				/>

				<div className="flex min-w-0 flex-1 flex-col">
					<RequestTabsBar
						tabs={workspace.tabs}
						activeTabId={workspace.activeTabId}
						onActivate={(id) => dispatchWorkspace({ type: "activate-tab", id })}
						onClose={(id) => dispatchWorkspace({ type: "close-tab", id })}
						onCreate={handleCreateTab}
						onToggleSidebar={handleToggleSidebar}
					/>

					<div className="relative">
						{workspace.tabs.map((tab) => (
							<RequestWorkspaceTab
								key={tab.id}
								tab={tab}
								isActive={tab.id === workspace.activeTabId}
								onDraftAction={(action) => handleDraftAction(tab.id, action)}
								onTimeoutChange={(timeoutMs) =>
									handleTimeoutChange(tab.id, timeoutMs)
								}
							/>
						))}
					</div>
				</div>
			</div>

			<HistoryPanel onRestore={handleOpenRequest} />
		</div>
	);
}
