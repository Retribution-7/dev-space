import {
	Delete02Icon,
	Edit02Icon,
	FileCodeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

import type { Snippet } from "../model/types";

type SnippetListProps = {
	snippets: Snippet[];
	className?: string;
	onEdit?: (snippet: Snippet) => void;
	onDelete?: (snippet: Snippet) => void;
};

type SnippetListItemProps = {
	snippet: Snippet;
	onEdit?: (snippet: Snippet) => void;
	onDelete?: (snippet: Snippet) => void;
};

const updatedAtFormatter = new Intl.DateTimeFormat("en", {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

const TAG_CLASS_NAME =
	"bg-muted/60 text-muted-foreground inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-medium break-all";

export function SnippetList({
	snippets,
	className,
	onEdit,
	onDelete,
}: SnippetListProps) {
	if (snippets.length === 0) {
		return (
			<Card className={cn("gap-0 py-0 shadow-xs", className)}>
				<CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
					<span className="bg-muted text-muted-foreground grid size-11 place-items-center rounded-full">
						<HugeiconsIcon
							icon={FileCodeIcon}
							className="size-5"
							aria-hidden="true"
						/>
					</span>
					<div className="max-w-sm">
						<p className="text-sm font-medium">No snippets yet</p>
						<p className="text-muted-foreground mt-1 text-sm text-pretty">
							Snippets you save will appear here.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={cn("gap-0 py-0 shadow-xs", className)}>
			<CardContent className="p-0">
				<ul className="divide-y">
					{snippets.map((snippet) => (
						<SnippetListItem
							key={snippet.id}
							snippet={snippet}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}

function SnippetListItem({ snippet, onEdit, onDelete }: SnippetListItemProps) {
	const hasActions = onEdit !== undefined || onDelete !== undefined;

	return (
		<li className="flex items-start gap-3 px-4 py-4 sm:px-5">
			<span className="bg-muted text-muted-foreground mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg">
				<HugeiconsIcon
					icon={FileCodeIcon}
					className="size-4"
					aria-hidden="true"
				/>
			</span>

			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-3">
					<h3
						className="line-clamp-2 min-w-0 flex-1 text-sm font-medium break-words"
						title={snippet.title}
					>
						{snippet.title}
					</h3>

					<div className="flex shrink-0 flex-col items-end gap-1">
						<time
							dateTime={snippet.updatedAt}
							title={snippet.updatedAt}
							className="text-muted-foreground text-xs whitespace-nowrap"
						>
							Updated {formatUpdatedAt(snippet.updatedAt)}
						</time>

						{hasActions ? (
							<div className="-mr-1.5 flex items-center gap-0.5">
								{onEdit ? (
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										className="text-muted-foreground hover:text-foreground"
										title="Edit snippet"
										aria-label={`Edit ${snippet.title}`}
										onClick={() => onEdit(snippet)}
									>
										<HugeiconsIcon
											icon={Edit02Icon}
											className="size-3.5"
											aria-hidden="true"
										/>
									</Button>
								) : null}
								{onDelete ? (
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										className="text-muted-foreground hover:text-destructive"
										title="Delete snippet"
										aria-label={`Delete ${snippet.title}`}
										onClick={() => onDelete(snippet)}
									>
										<HugeiconsIcon
											icon={Delete02Icon}
											className="size-3.5"
											aria-hidden="true"
										/>
									</Button>
								) : null}
							</div>
						) : null}
					</div>
				</div>

				{snippet.description ? (
					<p
						className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5 text-pretty break-words"
						title={snippet.description}
					>
						{snippet.description}
					</p>
				) : null}

				<div className="mt-2.5 flex flex-wrap items-center gap-1.5">
					<span className="bg-primary/10 text-primary inline-flex max-w-full items-center rounded-md px-2 py-0.5 font-mono text-[0.7rem] font-medium break-all">
						{snippet.language}
					</span>
					{snippet.tags.map((tag, index) => (
						<span
							key={`${tag}-${index}`}
							className={TAG_CLASS_NAME}
							title={tag}
						>
							{tag}
						</span>
					))}
				</div>
			</div>
		</li>
	);
}

function formatUpdatedAt(value: string): string {
	const date = new Date(value);

	return Number.isNaN(date.getTime()) ? value : updatedAtFormatter.format(date);
}
