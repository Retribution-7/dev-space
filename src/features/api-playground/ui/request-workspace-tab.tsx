"use client";

import { Link01Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/shared/lib/utils";

import { executeRequest } from "../api/send-request";
import { prepareRequest } from "../model/request-config";
import {
	getFilledRowCount,
	type RequestDraftAction,
} from "../model/request-draft";
import { UNEXPECTED_REQUEST_ERROR_MESSAGE } from "../model/request-errors";
import {
	describeRequestExecution,
	type RequestFeedback,
} from "../model/request-feedback";
import { createRequestHistoryEntry } from "../model/request-history";
import { useRequestHistoryStore } from "../model/request-history-store";
import {
	createRequestSendState,
	requestSendReducer,
} from "../model/request-send-state";
import type { OpenRequestTab } from "../model/request-workspace";
import type {
	KeyValueField,
	KeyValueSection,
	RequestExecution,
} from "../model/types";

import { KeyValueEditor } from "./key-value-editor";
import { RequestBar } from "./request-bar";
import { RequestBodyEditor } from "./request-body-editor";
import { RequestFeedbackBanner } from "./request-feedback";
import { ResponsePanel } from "./response-panel";

type RequestWorkspaceTabProps = {
	tab: OpenRequestTab;
	isActive: boolean;
	onDraftAction: (action: RequestDraftAction) => void;
	onTimeoutChange: (timeoutMs: number) => void;
};

export function RequestWorkspaceTab({
	tab,
	isActive,
	onDraftAction,
	onTimeoutChange,
}: RequestWorkspaceTabProps) {
	const [sendState, dispatchSend] = React.useReducer(
		requestSendReducer,
		undefined,
		createRequestSendState,
	);
	const { isSending, execution: lastExecution, validationIssue } = sendState;
	const addHistoryEntry = useRequestHistoryStore((state) => state.addEntry);
	const abortRef = React.useRef<AbortController | null>(null);
	const requestIdRef = React.useRef(0);
	const recordedHistoryRequestIdRef = React.useRef(0);
	const isSendingRef = React.useRef(false);
	const isMountedRef = React.useRef(true);

	React.useEffect(() => {
		isMountedRef.current = true;

		return () => {
			isMountedRef.current = false;
			abortRef.current?.abort();
		};
	}, []);

	const paramsCount = getFilledRowCount(tab.draft.params);
	const headersCount = getFilledRowCount(tab.draft.headers);
	const feedback: RequestFeedback | null = isSending
		? null
		: validationIssue
			? { tone: "error", message: validationIssue.message }
			: lastExecution
				? describeRequestExecution(lastExecution)
				: null;

	function updateDraft(action: RequestDraftAction) {
		dispatchSend({ type: "clear-validation" });
		onDraftAction(action);
	}

	function addRow(section: KeyValueSection) {
		updateDraft({ type: "add-row", section, id: crypto.randomUUID() });
	}

	function changeRow(
		section: KeyValueSection,
		id: string,
		field: KeyValueField,
		value: string,
	) {
		updateDraft({ type: "update-row", section, id, field, value });
	}

	function removeRow(section: KeyValueSection, id: string) {
		updateDraft({ type: "remove-row", section, id });
	}

	async function handleSend() {
		if (isSendingRef.current) {
			return;
		}

		const preparation = prepareRequest(tab.draft, {
			pageProtocol: window.location.protocol,
		});

		if (!preparation.ok) {
			dispatchSend({
				type: "validation-failed",
				issue: preparation.issue,
			});
			return;
		}

		const requestId = requestIdRef.current + 1;
		const controller = new AbortController();
		const startedAt = performance.now();

		requestIdRef.current = requestId;
		abortRef.current = controller;
		isSendingRef.current = true;
		dispatchSend({ type: "start" });

		try {
			let execution: RequestExecution;

			try {
				execution = await executeRequest(preparation.request, {
					signal: controller.signal,
					timeoutMs: tab.timeoutMs,
				});
			} catch {
				execution = {
					status: "unexpected-error",
					message: UNEXPECTED_REQUEST_ERROR_MESSAGE,
				};
			}

			if (requestId !== requestIdRef.current || !isMountedRef.current) {
				return;
			}

			dispatchSend({ type: "settled", execution });

			if (recordedHistoryRequestIdRef.current !== requestId) {
				recordedHistoryRequestIdRef.current = requestId;
				addHistoryEntry(
					createRequestHistoryEntry(tab.draft, execution, {
						id: crypto.randomUUID(),
						executedAt: new Date().toISOString(),
						durationMs: performance.now() - startedAt,
					}),
				);
			}
		} finally {
			if (requestId === requestIdRef.current) {
				isSendingRef.current = false;
				abortRef.current = null;
			}
		}
	}

	function handleCancel() {
		abortRef.current?.abort();
	}

	return (
		<div className={cn(!isActive && "hidden")}>
			<div className="flex flex-col">
				<div className="flex flex-col gap-2 border-b px-4 py-4">
					<RequestBar
						method={tab.draft.method}
						url={tab.draft.url}
						timeoutMs={tab.timeoutMs}
						isSending={isSending}
						onMethodChange={(method) =>
							updateDraft({ type: "set-method", method })
						}
						onUrlChange={(url) => updateDraft({ type: "set-url", url })}
						onTimeoutChange={onTimeoutChange}
						onSubmit={() => void handleSend()}
						onCancel={handleCancel}
					/>

					{feedback ? <RequestFeedbackBanner feedback={feedback} /> : null}
				</div>

				<Tabs defaultValue="params" className="gap-0">
					<div className="border-b px-4 py-3">
						<TabsList aria-label="Request configuration" className="gap-1">
							<TabsTrigger value="params" className="px-3">
								Params
								<TabCount count={paramsCount} />
							</TabsTrigger>
							<TabsTrigger value="headers" className="px-3">
								Headers
								<TabCount count={headersCount} />
							</TabsTrigger>
							<TabsTrigger value="body" className="px-3">
								Body
								{tab.draft.bodyType !== "none" ? (
									<span className="text-muted-foreground text-[0.7rem]">
										{tab.draft.bodyType === "json" ? "JSON" : "Text"}
									</span>
								) : null}
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="params" className="px-4 py-4">
						<KeyValueEditor
							rows={tab.draft.params}
							icon={Link01Icon}
							itemLabel="Query parameter"
							emptyTitle="No query parameters"
							emptyDescription="Add key-value pairs to append them to the request URL."
							addLabel="Add parameter"
							onAdd={() => addRow("params")}
							onChange={(id, field, value) =>
								changeRow("params", id, field, value)
							}
							onRemove={(id) => removeRow("params", id)}
						/>
					</TabsContent>

					<TabsContent value="headers" className="px-4 py-4">
						<KeyValueEditor
							rows={tab.draft.headers}
							icon={Settings02Icon}
							itemLabel="Header"
							emptyTitle="No headers"
							emptyDescription="Add headers such as Authorization or Content-Type."
							addLabel="Add header"
							onAdd={() => addRow("headers")}
							onChange={(id, field, value) =>
								changeRow("headers", id, field, value)
							}
							onRemove={(id) => removeRow("headers", id)}
						/>
					</TabsContent>

					<TabsContent value="body" className="px-4 py-4">
						<RequestBodyEditor
							bodyType={tab.draft.bodyType}
							body={tab.draft.body}
							onBodyTypeChange={(bodyType) =>
								updateDraft({ type: "set-body-type", bodyType })
							}
							onBodyChange={(body) => updateDraft({ type: "set-body", body })}
						/>
					</TabsContent>
				</Tabs>

				<div className="border-t px-4 py-4">
					<ResponsePanel execution={lastExecution} isSending={isSending} />
				</div>
			</div>
		</div>
	);
}

function TabCount({ count }: { count: number }) {
	return (
		<span className="text-muted-foreground ml-1.5 rounded-full border px-1.5 text-[0.7rem] tabular-nums">
			({count})
		</span>
	);
}
