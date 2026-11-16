"use client";

import {
	ApiIcon,
	Link01Icon,
	Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { executeRequest } from "../api/send-request";
import { prepareRequest } from "../model/request-config";
import {
	createRequestDraft,
	getFilledRowCount,
	type RequestDraftAction,
	requestDraftReducer,
} from "../model/request-draft";
import { UNEXPECTED_REQUEST_ERROR_MESSAGE } from "../model/request-errors";
import {
	describeRequestExecution,
	type RequestFeedback,
} from "../model/request-feedback";
import {
	createRequestSendState,
	requestSendReducer,
} from "../model/request-send-state";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../model/request-timeout";
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

export function ApiPlayground() {
	const [draft, dispatch] = React.useReducer(
		requestDraftReducer,
		undefined,
		createRequestDraft,
	);
	const [sendState, dispatchSend] = React.useReducer(
		requestSendReducer,
		undefined,
		createRequestSendState,
	);
	const { isSending, execution: lastExecution, validationIssue } = sendState;
	const [timeoutMs, setTimeoutMs] = React.useState(DEFAULT_REQUEST_TIMEOUT_MS);
	const abortRef = React.useRef<AbortController | null>(null);
	const requestIdRef = React.useRef(0);
	const isSendingRef = React.useRef(false);
	const isMountedRef = React.useRef(true);

	React.useEffect(() => {
		isMountedRef.current = true;

		return () => {
			isMountedRef.current = false;
			abortRef.current?.abort();
		};
	}, []);

	const paramsCount = getFilledRowCount(draft.params);
	const headersCount = getFilledRowCount(draft.headers);
	const feedback: RequestFeedback | null = isSending
		? null
		: validationIssue
			? { tone: "error", message: validationIssue.message }
			: lastExecution
				? describeRequestExecution(lastExecution)
				: null;

	function updateDraft(action: RequestDraftAction) {
		dispatchSend({ type: "clear-validation" });
		dispatch(action);
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

		const preparation = prepareRequest(draft, {
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

		requestIdRef.current = requestId;
		abortRef.current = controller;
		isSendingRef.current = true;
		dispatchSend({ type: "start" });

		try {
			let execution: RequestExecution;

			try {
				execution = await executeRequest(preparation.request, {
					signal: controller.signal,
					timeoutMs,
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
		<div className="flex flex-col gap-6">
			<Card className="gap-0 py-0 shadow-xs">
				<CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b">
					<span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
						<HugeiconsIcon
							icon={ApiIcon}
							className="size-4"
							aria-hidden="true"
						/>
					</span>
					<div className="min-w-0 flex-1">
						<CardTitle className="text-sm">Request Builder</CardTitle>
						<CardDescription className="text-xs">
							Compose an HTTP request with query parameters, headers, and a
							body.
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					<div className="flex flex-col gap-3 border-b p-4">
						<RequestBar
							method={draft.method}
							url={draft.url}
							timeoutMs={timeoutMs}
							isSending={isSending}
							onMethodChange={(method) =>
								updateDraft({ type: "set-method", method })
							}
							onUrlChange={(url) => updateDraft({ type: "set-url", url })}
							onTimeoutChange={setTimeoutMs}
							onSubmit={() => void handleSend()}
							onCancel={handleCancel}
						/>

						{feedback ? <RequestFeedbackBanner feedback={feedback} /> : null}
					</div>

					<Tabs defaultValue="params" className="gap-0">
						<div className="border-b px-4 py-2">
							<TabsList aria-label="Request configuration">
								<TabsTrigger value="params">
									Params
									<TabCount count={paramsCount} />
								</TabsTrigger>
								<TabsTrigger value="headers">
									Headers
									<TabCount count={headersCount} />
								</TabsTrigger>
								<TabsTrigger value="body">
									Body
									{draft.bodyType !== "none" ? (
										<span className="text-muted-foreground text-[0.7rem]">
											{draft.bodyType === "json" ? "JSON" : "Text"}
										</span>
									) : null}
								</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="params" className="p-4">
							<KeyValueEditor
								rows={draft.params}
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

						<TabsContent value="headers" className="p-4">
							<KeyValueEditor
								rows={draft.headers}
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

						<TabsContent value="body" className="p-4">
							<RequestBodyEditor
								bodyType={draft.bodyType}
								body={draft.body}
								onBodyTypeChange={(bodyType) =>
									updateDraft({ type: "set-body-type", bodyType })
								}
								onBodyChange={(body) => updateDraft({ type: "set-body", body })}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			<ResponsePanel execution={lastExecution} isSending={isSending} />
		</div>
	);
}

function TabCount({ count }: { count: number }) {
	return (
		<span className="text-muted-foreground text-[0.7rem] tabular-nums">
			({count})
		</span>
	);
}
