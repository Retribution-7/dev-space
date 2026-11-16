"use client";

import {
	AlertCircleIcon,
	CancelCircleIcon,
	Clock01Icon,
	CodeIcon,
	Database01Icon,
	File01Icon,
	InboxIcon,
	Loading03Icon,
	Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CodeEditor } from "@/components/ui/code-editor";
import { CopyButton } from "@/components/ui/copy-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/shared/lib/utils";

import { formatBytes, formatDuration } from "../model/request-feedback";
import {
	createResponseBodyView,
	getResponseContentType,
	type ResponseBodyView,
} from "../model/response-body";
import {
	getResponsePanelView,
	type ResponsePanelView,
} from "../model/response-panel-state";
import type { HttpResponse, RequestExecution } from "../model/types";

type ResponsePanelProps = {
	execution: RequestExecution | null;
	isSending: boolean;
};

type ResponseBodyFrameProps = {
	label: string;
	actions?: React.ReactNode;
	children: React.ReactNode;
};

type StateMessageProps = {
	icon: IconSvgElement;
	title: string;
	description: string;
	detail?: string;
};

type SummaryMetricProps = {
	icon: IconSvgElement;
	label: string;
	value: string;
};

const JSON_BODY_ACTIONS_LABEL = "JSON body display";

export function ResponsePanel({ execution, isSending }: ResponsePanelProps) {
	const view = getResponsePanelView(execution, isSending);

	return (
		<Card role="region" aria-label="Response" className="gap-0 py-0 shadow-xs">
			<CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b">
				<span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
					<HugeiconsIcon
						icon={CodeIcon}
						className="size-4"
						aria-hidden="true"
					/>
				</span>
				<div className="min-w-0 flex-1">
					<CardTitle className="text-sm">Response</CardTitle>
					<CardDescription className="text-xs">
						Inspect the status, headers, and body of the last request.
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent className="p-0">
				<ResponsePanelContent view={view} />
			</CardContent>
		</Card>
	);
}

function ResponsePanelContent({ view }: { view: ResponsePanelView }) {
	switch (view.kind) {
		case "empty":
			return (
				<StateMessage
					icon={InboxIcon}
					title="No response yet"
					description="Send a request to see its status, headers, and body here."
				/>
			);
		case "loading":
			return <LoadingState />;
		case "response":
			return <ResponseDetails response={view.response} />;
		case "network-error":
			return (
				<FailureState
					title="Network error"
					description={view.message}
					code={view.code}
				/>
			);
		case "canceled":
			return (
				<FailureState
					tone="neutral"
					title="Request canceled"
					description="The request was canceled before a response was received."
				/>
			);
		case "unexpected-error":
			return <FailureState title="Request failed" description={view.message} />;
	}
}

function LoadingState() {
	return (
		<div
			role="status"
			aria-live="polite"
			className="flex flex-col items-center gap-3 px-4 py-12 text-center"
		>
			<span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-full">
				<HugeiconsIcon
					icon={Loading03Icon}
					className="size-5 animate-spin"
					aria-hidden="true"
				/>
			</span>
			<div>
				<p className="text-sm font-medium">Sending request...</p>
				<p className="text-muted-foreground mt-1 text-sm">
					Waiting for the server response.
				</p>
			</div>
		</div>
	);
}

function ResponseDetails({ response }: { response: HttpResponse }) {
	const contentType = getResponseContentType(response.headers);
	const headersCount = Object.keys(response.headers).length;

	return (
		<>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
				<Badge
					variant="outline"
					className={cn(
						"h-6 gap-1.5 px-2 font-mono text-xs",
						getStatusBadgeClassName(response.status),
					)}
				>
					<span className="font-semibold">{response.status}</span>
					{response.statusText ? (
						<span className="font-normal">{response.statusText}</span>
					) : null}
				</Badge>

				<SummaryMetric
					icon={Clock01Icon}
					label="Duration"
					value={formatDuration(response.durationMs)}
				/>
				<SummaryMetric
					icon={Database01Icon}
					label="Size"
					value={formatBytes(response.sizeBytes)}
				/>

				{contentType ? (
					<span
						className="text-muted-foreground ml-auto max-w-full min-w-0 truncate font-mono text-xs"
						title={contentType}
					>
						{contentType}
					</span>
				) : null}
			</div>

			<Tabs defaultValue="body" className="gap-0">
				<div className="border-b px-4 py-2">
					<TabsList aria-label="Response sections">
						<TabsTrigger value="body">Body</TabsTrigger>
						<TabsTrigger value="headers">
							Headers
							<span className="text-muted-foreground text-[0.7rem] tabular-nums">
								({headersCount})
							</span>
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="body" className="p-4">
					<ResponseBody response={response} />
				</TabsContent>

				<TabsContent value="headers" className="p-4">
					<ResponseHeaders headers={response.headers} />
				</TabsContent>
			</Tabs>
		</>
	);
}

function SummaryMetric({ icon, label, value }: SummaryMetricProps) {
	return (
		<span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
			<HugeiconsIcon icon={icon} className="size-3.5" aria-hidden="true" />
			<span className="sr-only">{label}:</span>
			<span className="tabular-nums">{value}</span>
		</span>
	);
}

function ResponseBody({ response }: { response: HttpResponse }) {
	const view = React.useMemo(
		() => createResponseBodyView(response),
		[response],
	);

	switch (view.kind) {
		case "empty":
			return (
				<StateMessage
					icon={File01Icon}
					title="Empty response body"
					description="The server returned a response without a body."
					detail={formatContentTypeDetail(view.contentType)}
				/>
			);
		case "json":
			return <JsonBodyViewer view={view} />;
		case "invalid-json":
			return <InvalidJsonBodyViewer view={view} />;
		case "text":
			return (
				<RawBodyViewer
					label="Text"
					language=""
					raw={view.raw}
					ariaLabel="Text response body"
				/>
			);
		case "html":
			return (
				<RawBodyViewer
					label="HTML source"
					language="html"
					raw={view.raw}
					ariaLabel="HTML response body source"
				/>
			);
		case "xml":
			return (
				<RawBodyViewer
					label="XML"
					language="xml"
					raw={view.raw}
					ariaLabel="XML response body"
				/>
			);
		case "binary":
			return (
				<StateMessage
					icon={File01Icon}
					title="Binary response"
					description={view.message}
					detail={formatContentTypeDetail(view.contentType)}
				/>
			);
		case "unsupported":
			return (
				<StateMessage
					icon={File01Icon}
					title="Unsupported response format"
					description={view.message}
					detail={formatContentTypeDetail(view.contentType)}
				/>
			);
	}
}

function JsonBodyViewer({
	view,
}: {
	view: Extract<ResponseBodyView, { kind: "json" }>;
}) {
	const [mode, setMode] = React.useState<"pretty" | "raw">("pretty");
	const isPretty = mode === "pretty";
	const displayedBody = isPretty ? view.pretty : view.raw;

	return (
		<ResponseBodyFrame
			label="JSON"
			actions={
				<>
					<div
						role="group"
						aria-label={JSON_BODY_ACTIONS_LABEL}
						className="bg-background inline-flex items-center rounded-md border p-0.5"
					>
						<Button
							type="button"
							size="xs"
							variant={isPretty ? "secondary" : "ghost"}
							aria-pressed={isPretty}
							onClick={() => setMode("pretty")}
						>
							Pretty
						</Button>
						<Button
							type="button"
							size="xs"
							variant={!isPretty ? "secondary" : "ghost"}
							aria-pressed={!isPretty}
							onClick={() => setMode("raw")}
						>
							Raw
						</Button>
					</div>
					<CopyButton
						getValue={() => displayedBody}
						ariaLabel="Copy response body"
						size="xs"
					/>
				</>
			}
		>
			<CodeEditor
				value={displayedBody}
				language="json"
				readOnly
				ariaLabel={`${isPretty ? "Pretty" : "Raw"} JSON response body`}
			/>
		</ResponseBodyFrame>
	);
}

function InvalidJsonBodyViewer({
	view,
}: {
	view: Extract<ResponseBodyView, { kind: "invalid-json" }>;
}) {
	return (
		<div className="flex flex-col gap-3">
			<div
				role="alert"
				className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm"
			>
				<HugeiconsIcon
					icon={AlertCircleIcon}
					className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
					aria-hidden="true"
				/>
				<p className="min-w-0">{view.message}</p>
			</div>

			<ResponseBodyFrame
				label="Raw JSON"
				actions={
					<CopyButton
						getValue={() => view.raw}
						ariaLabel="Copy raw response body"
						size="xs"
					/>
				}
			>
				<CodeEditor
					value={view.raw}
					readOnly
					ariaLabel="Raw invalid JSON response body"
				/>
			</ResponseBodyFrame>
		</div>
	);
}

function RawBodyViewer({
	label,
	language,
	raw,
	ariaLabel,
}: {
	label: string;
	language: string;
	raw: string;
	ariaLabel: string;
}) {
	return (
		<ResponseBodyFrame
			label={label}
			actions={
				<CopyButton
					getValue={() => raw}
					ariaLabel="Copy response body"
					size="xs"
				/>
			}
		>
			<CodeEditor
				value={raw}
				language={language}
				readOnly
				ariaLabel={ariaLabel}
			/>
		</ResponseBodyFrame>
	);
}

function ResponseBodyFrame({
	label,
	actions,
	children,
}: ResponseBodyFrameProps) {
	return (
		<div className="overflow-hidden rounded-lg border">
			<div className="bg-muted/40 flex flex-wrap items-center gap-2 border-b px-2 py-1.5">
				<span className="text-muted-foreground px-1 text-xs font-medium">
					{label}
				</span>
				{actions ? (
					<div className="ml-auto flex flex-wrap items-center gap-1.5">
						{actions}
					</div>
				) : null}
			</div>
			<div className="h-[clamp(16rem,38svh,28rem)]">{children}</div>
		</div>
	);
}

function ResponseHeaders({ headers }: { headers: Record<string, string> }) {
	const entries = Object.entries(headers).sort(([left], [right]) =>
		left.localeCompare(right),
	);

	if (entries.length === 0) {
		return (
			<StateMessage
				icon={Settings02Icon}
				title="No response headers"
				description="The server did not return any response headers."
			/>
		);
	}

	return (
		<div className="overflow-hidden rounded-lg border">
			<dl className="divide-y">
				{entries.map(([name, value]) => (
					<div
						key={name}
						className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(8rem,16rem)_minmax(0,1fr)] sm:gap-4"
					>
						<dt className="text-muted-foreground font-mono text-xs font-medium break-all">
							{name}
						</dt>
						<dd className="font-mono text-xs break-all whitespace-pre-wrap">
							{value}
						</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

function FailureState({
	title,
	description,
	code,
	tone = "error",
}: {
	title: string;
	description: string;
	code?: string;
	tone?: "error" | "neutral";
}) {
	const isError = tone === "error";

	return (
		<div role={isError ? "alert" : "status"} className="p-4">
			<div
				className={cn(
					"flex items-start gap-3 rounded-lg border p-3",
					isError ? "border-destructive/20 bg-destructive/5" : "bg-muted/40",
				)}
			>
				<HugeiconsIcon
					icon={isError ? AlertCircleIcon : CancelCircleIcon}
					className={cn(
						"mt-0.5 size-4 shrink-0",
						isError ? "text-destructive" : "text-muted-foreground",
					)}
					aria-hidden="true"
				/>
				<div className="min-w-0">
					<p className="text-sm font-medium">{title}</p>
					<p className="text-muted-foreground mt-1 text-sm">{description}</p>
					{code ? (
						<p className="text-muted-foreground mt-2 font-mono text-xs">
							Code: {code}
						</p>
					) : null}
				</div>
			</div>
		</div>
	);
}

function StateMessage({ icon, title, description, detail }: StateMessageProps) {
	return (
		<div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
			<span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-full">
				<HugeiconsIcon icon={icon} className="size-5" aria-hidden="true" />
			</span>
			<div className="max-w-md">
				<p className="text-sm font-medium">{title}</p>
				<p className="text-muted-foreground mt-1 text-sm">{description}</p>
				{detail ? (
					<p className="text-muted-foreground mt-2 font-mono text-xs break-all">
						{detail}
					</p>
				) : null}
			</div>
		</div>
	);
}

function formatContentTypeDetail(
	contentType: string | null,
): string | undefined {
	return contentType ? `Content-Type: ${contentType}` : undefined;
}

function getStatusBadgeClassName(status: number): string {
	if (status >= 200 && status < 300) {
		return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:text-emerald-300";
	}

	if (status >= 300 && status < 400) {
		return "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:border-sky-400/25 dark:text-sky-300";
	}

	if (status >= 400 && status < 500) {
		return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:text-amber-300";
	}

	return "border-destructive/25 bg-destructive/10 text-destructive dark:border-destructive/30";
}
