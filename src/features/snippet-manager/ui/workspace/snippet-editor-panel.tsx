"use client";

import {
	Add01Icon,
	CodeIcon,
	Delete02Icon,
	Edit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { CopyButton } from "@/components/ui/copy-button";

import { DEFAULT_SNIPPET_LANGUAGE } from "../../model/snippet-draft";
import {
	getTabLabel,
	isTabDirty,
	type SnippetTab,
} from "../../model/snippets-workspace";

type SnippetEditorPanelProps = {
	tab: SnippetTab | null;
	onCodeChange: (code: string) => void;
	onSave: () => void;
	onEditMetadata: () => void;
	onDelete: () => void;
	onCreate: () => void;
};

export function SnippetEditorPanel({
	tab,
	onCodeChange,
	onSave,
	onEditMetadata,
	onDelete,
	onCreate,
}: SnippetEditorPanelProps) {
	if (!tab) {
		return (
			<div className="bg-card flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
				<span className="bg-muted text-muted-foreground grid size-12 place-items-center rounded-full">
					<HugeiconsIcon
						icon={CodeIcon}
						className="size-6"
						aria-hidden="true"
					/>
				</span>
				<div className="max-w-sm">
					<p className="text-sm font-medium">No snippet open</p>
					<p className="text-muted-foreground mt-1 text-sm text-pretty">
						Select a snippet in the sidebar or create a new one to start
						editing.
					</p>
				</div>
				<Button type="button" size="sm" variant="outline" onClick={onCreate}>
					<HugeiconsIcon
						icon={Add01Icon}
						className="size-3.5"
						data-icon="inline-start"
						aria-hidden="true"
					/>
					New Snippet
				</Button>
			</div>
		);
	}

	const label = getTabLabel(tab);
	const isDirty = isTabDirty(tab);
	const language = tab.draft.language.trim() || DEFAULT_SNIPPET_LANGUAGE;

	return (
		<div
			role="tabpanel"
			aria-labelledby={`snippet-tab-${tab.tabId}`}
			className="bg-card flex min-h-0 flex-1 flex-col"
		>
			<div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<span className="truncate text-sm font-medium" title={label}>
						{label}
					</span>
					<span className="bg-primary/10 text-primary inline-flex shrink-0 items-center rounded-md px-2 py-0.5 font-mono text-[0.7rem] font-medium">
						{language}
					</span>
					{isDirty ? (
						<span className="text-muted-foreground shrink-0 text-xs">
							Unsaved changes
						</span>
					) : null}
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					<Button
						type="button"
						size="sm"
						onClick={onSave}
						disabled={!isDirty}
						title={isDirty ? "Save changes" : "No changes to save"}
					>
						Save
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onEditMetadata}
					>
						<HugeiconsIcon
							icon={Edit02Icon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Details
					</Button>
					<CopyButton
						getValue={() => tab.draft.code}
						ariaLabel="Copy code to clipboard"
						label="Copy"
						copiedLabel="Copied"
						size="sm"
					/>
					{tab.snippetId !== null ? (
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onClick={onDelete}
						>
							<HugeiconsIcon
								icon={Delete02Icon}
								className="size-3.5"
								data-icon="inline-start"
								aria-hidden="true"
							/>
							Delete
						</Button>
					) : null}
				</div>
			</div>

			<div className="min-h-0 flex-1">
				<CodeEditor
					value={tab.draft.code}
					language={language}
					ariaLabel={`Code editor for ${label}`}
					onChange={onCodeChange}
				/>
			</div>
		</div>
	);
}
