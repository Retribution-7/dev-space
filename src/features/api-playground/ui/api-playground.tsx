"use client";

import {
	ApiIcon,
	InformationCircleIcon,
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

import {
	createRequestDraft,
	getFilledRowCount,
	type RequestDraftAction,
	requestDraftReducer,
} from "../model/request-draft";
import type { KeyValueField, KeyValueSection } from "../model/types";

import { KeyValueEditor } from "./key-value-editor";
import { RequestBar } from "./request-bar";
import { RequestBodyEditor } from "./request-body-editor";

const SEND_NOT_AVAILABLE_MESSAGE =
	"Request sending will be available in the next step.";

export function ApiPlayground() {
	const [draft, dispatch] = React.useReducer(
		requestDraftReducer,
		undefined,
		createRequestDraft,
	);
	const [notice, setNotice] = React.useState<string | null>(null);

	const paramsCount = getFilledRowCount(draft.params);
	const headersCount = getFilledRowCount(draft.headers);

	function updateDraft(action: RequestDraftAction) {
		setNotice(null);
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

	function handleSend() {
		setNotice(SEND_NOT_AVAILABLE_MESSAGE);
	}

	return (
		<Card className="gap-0 py-0 shadow-xs">
			<CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b">
				<span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
					<HugeiconsIcon icon={ApiIcon} className="size-4" aria-hidden="true" />
				</span>
				<div className="min-w-0 flex-1">
					<CardTitle className="text-sm">Request Builder</CardTitle>
					<CardDescription className="text-xs">
						Compose an HTTP request with query parameters, headers, and a body.
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent className="p-0">
				<div className="flex flex-col gap-3 border-b p-4">
					<RequestBar
						method={draft.method}
						url={draft.url}
						onMethodChange={(method) =>
							updateDraft({ type: "set-method", method })
						}
						onUrlChange={(url) => updateDraft({ type: "set-url", url })}
						onSubmit={handleSend}
					/>

					{notice ? (
						<div
							role="status"
							className="bg-muted/40 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
						>
							<HugeiconsIcon
								icon={InformationCircleIcon}
								className="text-muted-foreground mt-0.5 size-4 shrink-0"
								aria-hidden="true"
							/>
							<p className="min-w-0">{notice}</p>
						</div>
					) : null}
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
	);
}

function TabCount({ count }: { count: number }) {
	return (
		<span className="text-muted-foreground text-[0.7rem] tabular-nums">
			({count})
		</span>
	);
}
