"use client";

import {
	Delete02Icon,
	HistoryIcon,
	InboxIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

import { formatDuration } from "../model/request-feedback";
import type {
	RequestHistoryEntry,
	RequestHistoryOutcome,
	RequestHistoryResult,
} from "../model/request-history";
import { toRequestDraft } from "../model/request-history";
import type { RequestDraft } from "../model/types";
import {
	useRequestHistory,
	useRequestHistoryHydration,
} from "../model/use-request-history";

import { ConfirmDialog } from "./confirm-dialog";

type HistoryPanelProps = {
	onRestore: (draft: RequestDraft) => void;
};

type HistoryItemProps = {
	entry: RequestHistoryEntry;
	onRestore: (entry: RequestHistoryEntry) => void;
	onDelete: (id: string) => void;
};

const HISTORY_STATUS_STYLES: Record<RequestHistoryOutcome, string> = {
	success:
		"border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:text-emerald-300",
	"http-error":
		"border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:text-amber-300",
	"network-error":
		"border-destructive/25 bg-destructive/10 text-destructive dark:border-destructive/30",
	timeout:
		"border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:text-amber-300",
	canceled: "border-border bg-muted/50 text-muted-foreground",
	"unexpected-error":
		"border-destructive/25 bg-destructive/10 text-destructive dark:border-destructive/30",
};

export function HistoryPanel({ onRestore }: HistoryPanelProps) {
	const { entries, removeEntry, clearHistory } = useRequestHistory();
	const hasHydrated = useRequestHistoryHydration();
	const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false);

	return (
		<Card role="region" aria-label="History" className="gap-0 py-0 shadow-xs">
			<CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b">
				<span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
					<HugeiconsIcon
						icon={HistoryIcon}
						className="size-4"
						aria-hidden="true"
					/>
				</span>
				<div className="min-w-0 flex-1">
					<CardTitle className="text-sm">History</CardTitle>
					<CardDescription className="text-xs">
						Completed requests are saved here. Select one to restore it in the
						Request Builder.
					</CardDescription>
				</div>

				{hasHydrated && entries.length > 0 ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setIsClearDialogOpen(true)}
					>
						<HugeiconsIcon
							icon={Delete02Icon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Clear history
					</Button>
				) : null}
			</CardHeader>

			<CardContent className="p-0">
				{!hasHydrated ? (
					<HistorySkeleton />
				) : entries.length === 0 ? (
					<EmptyHistoryState />
				) : (
					<ul className="max-h-[24rem] overflow-y-auto">
						{entries.map((entry) => (
							<HistoryItem
								key={entry.id}
								entry={entry}
								onRestore={(historyEntry) =>
									onRestore(toRequestDraft(historyEntry))
								}
								onDelete={removeEntry}
							/>
						))}
					</ul>
				)}
			</CardContent>

			<ConfirmDialog
				open={isClearDialogOpen}
				onOpenChange={setIsClearDialogOpen}
				title="Clear request history?"
				description="This removes all saved history entries from this browser. The current request and response are not affected."
				confirmLabel="Clear history"
				destructive
				onConfirm={() => {
					clearHistory();
					setIsClearDialogOpen(false);
				}}
			/>
		</Card>
	);
}

function HistoryItem({ entry, onRestore, onDelete }: HistoryItemProps) {
	const statusLabel = getHistoryStatusLabel(entry.result);

	return (
		<li className="hover:bg-muted/40 flex items-start gap-2 border-b px-3 py-2.5 transition-colors last:border-b-0">
			<button
				type="button"
				className="flex min-w-0 flex-1 items-start gap-3 text-left"
				onClick={() => onRestore(entry)}
				title="Restore this request in the Request Builder"
			>
				<span className="w-12 shrink-0 font-mono text-xs font-semibold">
					{entry.draft.method}
				</span>

				<div className="min-w-0 flex-1">
					<p className="truncate font-mono text-xs" title={entry.draft.url}>
						{entry.draft.url}
					</p>

					<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem]">
						<span
							className={cn(
								"inline-flex items-center rounded-md border px-1.5 py-0.5 font-medium",
								HISTORY_STATUS_STYLES[entry.result.outcome],
							)}
						>
							{statusLabel}
						</span>
						<span className="text-muted-foreground">
							{formatDuration(entry.result.durationMs)}
						</span>
						<span className="text-muted-foreground">
							{formatExecutedAt(entry.executedAt)}
						</span>
					</div>

					{entry.result.message ? (
						<p className="text-muted-foreground mt-1 truncate text-xs">
							{entry.result.message}
						</p>
					) : null}
				</div>
			</button>

			<Button
				type="button"
				variant="ghost"
				size="icon-xs"
				className="text-muted-foreground hover:text-destructive shrink-0"
				onClick={() => onDelete(entry.id)}
				aria-label={`Delete history entry for ${entry.draft.method} ${entry.draft.url}`}
			>
				<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
			</Button>
		</li>
	);
}

function EmptyHistoryState() {
	return (
		<div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
			<span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-full">
				<HugeiconsIcon icon={InboxIcon} className="size-5" aria-hidden="true" />
			</span>
			<div className="max-w-md">
				<p className="text-sm font-medium">No requests yet</p>
				<p className="text-muted-foreground mt-1 text-sm">
					Send a request and it will appear here for quick reuse.
				</p>
			</div>
		</div>
	);
}

function HistorySkeleton() {
	return (
		<div
			role="status"
			aria-label="Loading request history"
			className="flex flex-col gap-1 p-2"
		>
			{Array.from({ length: 3 }, (_, index) => (
				<div key={index} className="flex items-center gap-3 px-1 py-2">
					<Skeleton className="h-3.5 w-10 shrink-0" />
					<div className="flex min-w-0 flex-1 flex-col gap-1.5">
						<Skeleton className="h-3.5 w-2/3 max-w-full" />
						<Skeleton className="h-3 w-32 max-w-full" />
					</div>
				</div>
			))}
		</div>
	);
}

function getHistoryStatusLabel(result: RequestHistoryResult): string {
	switch (result.outcome) {
		case "success":
		case "http-error":
			return result.statusCode
				? `${result.statusCode}${result.statusText ? ` ${result.statusText}` : ""}`
				: result.outcome === "success"
					? "Success"
					: "HTTP error";
		case "network-error":
			return "Network error";
		case "timeout":
			return "Timeout";
		case "canceled":
			return "Canceled";
		case "unexpected-error":
			return "Error";
	}
}

function formatExecutedAt(value: string): string {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Unknown time";
	}

	return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
