"use client";

import {
	Add01Icon,
	AlertCircleIcon,
	CheckmarkCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

import type { Snippet, SnippetDraft } from "../model/types";
import { useSnippets } from "../model/use-snippets";

import { ConfirmDialog } from "./confirm-dialog";
import { SnippetFormSheet } from "./snippet-form-sheet";
import { SnippetList } from "./snippet-list";

type Feedback = {
	status: "success" | "error";
	message: string;
};

type FormState = {
	open: boolean;
	snippet: Snippet | null;
	session: number;
};

export function SnippetManager() {
	const { snippets, createSnippet, updateSnippet, deleteSnippet } =
		useSnippets();
	const [form, setForm] = React.useState<FormState>({
		open: false,
		snippet: null,
		session: 0,
	});
	const [pendingDelete, setPendingDelete] = React.useState<Snippet | null>(
		null,
	);
	const [feedback, setFeedback] = React.useState<Feedback | null>(null);

	function openCreateForm() {
		setFeedback(null);
		setForm((current) => ({
			open: true,
			snippet: null,
			session: current.session + 1,
		}));
	}

	function openEditForm(snippet: Snippet) {
		setFeedback(null);
		setForm((current) => ({
			open: true,
			snippet,
			session: current.session + 1,
		}));
	}

	function requestDelete(snippet: Snippet) {
		setFeedback(null);
		setPendingDelete(snippet);
	}

	function handleSave(draft: SnippetDraft) {
		try {
			if (form.snippet) {
				updateSnippet(form.snippet.id, draft);
				setFeedback({
					status: "success",
					message: `"${draft.title}" was updated.`,
				});
			} else {
				createSnippet(draft);
				setFeedback({
					status: "success",
					message: `"${draft.title}" was created.`,
				});
			}
		} catch {
			setFeedback({
				status: "error",
				message: "Could not save the snippet. Please try again.",
			});
			return;
		}

		setForm((current) => ({ ...current, open: false }));
	}

	function handleDeleteConfirm() {
		if (!pendingDelete) {
			return;
		}

		try {
			deleteSnippet(pendingDelete.id);
			setFeedback({
				status: "success",
				message: `"${pendingDelete.title}" was deleted.`,
			});
		} catch {
			setFeedback({
				status: "error",
				message: "Could not delete the snippet. Please try again.",
			});
		} finally {
			setPendingDelete(null);
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-muted-foreground text-sm">
					{snippets.length === 1 ? "1 snippet" : `${snippets.length} snippets`}
				</p>
				<Button
					type="button"
					size="sm"
					onClick={openCreateForm}
					className="w-full sm:w-auto"
				>
					<HugeiconsIcon
						icon={Add01Icon}
						className="size-3.5"
						data-icon="inline-start"
						aria-hidden="true"
					/>
					New snippet
				</Button>
			</div>

			{feedback ? <FeedbackBanner feedback={feedback} /> : null}

			<SnippetList
				snippets={snippets}
				onEdit={openEditForm}
				onDelete={requestDelete}
			/>

			<SnippetFormSheet
				key={form.session}
				open={form.open}
				snippet={form.snippet}
				onOpenChange={(open) => {
					setForm((current) => ({ ...current, open }));
				}}
				onSave={handleSave}
			/>

			<ConfirmDialog
				open={pendingDelete !== null}
				onOpenChange={(open) => {
					if (!open) {
						setPendingDelete(null);
					}
				}}
				title="Delete snippet?"
				description={
					pendingDelete ? (
						<>
							<span className="text-foreground font-medium">
								{pendingDelete.title}
							</span>{" "}
							will be permanently deleted. This action cannot be undone.
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

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
	const isError = feedback.status === "error";

	return (
		<div
			role={isError ? "alert" : "status"}
			className={cn(
				"flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
				isError
					? "border-destructive/20 bg-destructive/5"
					: "border-emerald-500/20 bg-emerald-500/5",
			)}
		>
			<HugeiconsIcon
				icon={isError ? AlertCircleIcon : CheckmarkCircleIcon}
				className={cn(
					"mt-0.5 size-4 shrink-0",
					isError
						? "text-destructive"
						: "text-emerald-600 dark:text-emerald-400",
				)}
				aria-hidden="true"
			/>
			<p className="min-w-0">{feedback.message}</p>
		</div>
	);
}
