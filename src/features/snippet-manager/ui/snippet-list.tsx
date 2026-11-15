import { FileCodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

import type { Snippet } from "../model/types";

type SnippetListProps = {
	snippets: Snippet[];
	className?: string;
};

const updatedAtFormatter = new Intl.DateTimeFormat("en", {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

const TAG_CLASS_NAME =
	"bg-muted/60 text-muted-foreground inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-medium break-all";

export function SnippetList({ snippets, className }: SnippetListProps) {
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
						<SnippetListItem key={snippet.id} snippet={snippet} />
					))}
				</ul>
			</CardContent>
		</Card>
	);
}

function SnippetListItem({ snippet }: { snippet: Snippet }) {
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
				<div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
					<h3
						className="line-clamp-2 min-w-0 text-sm font-medium break-words"
						title={snippet.title}
					>
						{snippet.title}
					</h3>
					<time
						dateTime={snippet.updatedAt}
						title={snippet.updatedAt}
						className="text-muted-foreground shrink-0 text-xs whitespace-nowrap"
					>
						Updated {formatUpdatedAt(snippet.updatedAt)}
					</time>
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
