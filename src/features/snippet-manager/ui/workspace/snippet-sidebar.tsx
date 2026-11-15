"use client";

import {
	Add01Icon,
	Delete02Icon,
	FileCodeIcon,
	Search01Icon,
	StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

import {
	EMPTY_SNIPPETS_FILTER,
	type SnippetsFilterState,
} from "../../model/snippets-filter";
import type { SnippetsSortOption } from "../../model/snippets-sort";
import type { Snippet } from "../../model/types";

import { SnippetFilterBar } from "./snippet-filter-bar";

type SnippetSidebarProps = {
	snippets: Snippet[];
	totalCount: number;
	activeSnippetId: string | null;
	isLoading?: boolean;
	filter: SnippetsFilterState;
	sort: SnippetsSortOption;
	availableLanguages: string[];
	availableTags: string[];
	onFilterChange: (filter: SnippetsFilterState) => void;
	onSortChange: (sort: SnippetsSortOption) => void;
	onSelect: (snippet: Snippet) => void;
	onToggleFavorite: (snippet: Snippet) => void;
	onCreate: () => void;
	onDelete: (snippet: Snippet) => void;
};

function SnippetSidebarSkeleton() {
	return (
		<div
			role="status"
			aria-label="Loading saved snippets"
			className="flex flex-col gap-1"
		>
			{Array.from({ length: 4 }, (_, index) => (
				<div key={index} className="flex items-center gap-2 px-2.5 py-2">
					<Skeleton className="size-4 shrink-0 rounded-md" />
					<div className="flex min-w-0 flex-1 flex-col gap-1.5">
						<Skeleton className="h-3.5 w-32 max-w-full" />
						<Skeleton className="h-3 w-14" />
					</div>
				</div>
			))}
		</div>
	);
}

function EmptyStateIcon({ icon }: { icon: typeof FileCodeIcon }) {
	return (
		<span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-full">
			<HugeiconsIcon icon={icon} className="size-5" aria-hidden="true" />
		</span>
	);
}

export function SnippetSidebar({
	snippets,
	totalCount,
	activeSnippetId,
	isLoading = false,
	filter,
	sort,
	availableLanguages,
	availableTags,
	onFilterChange,
	onSortChange,
	onSelect,
	onToggleFavorite,
	onCreate,
	onDelete,
}: SnippetSidebarProps) {
	return (
		<aside className="bg-muted/30 flex max-h-72 min-h-0 w-full flex-col border-b lg:max-h-none lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 xl:w-72">
			<div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
				<h2 className="text-sm font-semibold">Snippets</h2>
				<Button type="button" size="xs" onClick={onCreate}>
					<HugeiconsIcon
						icon={Add01Icon}
						className="size-3"
						data-icon="inline-start"
						aria-hidden="true"
					/>
					New Snippet
				</Button>
			</div>

			{totalCount > 0 ? (
				<SnippetFilterBar
					filter={filter}
					sort={sort}
					availableLanguages={availableLanguages}
					availableTags={availableTags}
					totalCount={totalCount}
					resultCount={snippets.length}
					onFilterChange={onFilterChange}
					onSortChange={onSortChange}
				/>
			) : null}

			<div className="min-h-0 flex-1 overflow-y-auto p-2">
				{isLoading ? (
					<SnippetSidebarSkeleton />
				) : totalCount === 0 ? (
					<div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
						<EmptyStateIcon icon={FileCodeIcon} />
						<div>
							<p className="text-sm font-medium">No snippets yet</p>
							<p className="text-muted-foreground mt-1 text-xs leading-5">
								Create your first snippet and it will be saved here.
							</p>
						</div>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={onCreate}
						>
							<HugeiconsIcon
								icon={Add01Icon}
								className="size-3.5"
								data-icon="inline-start"
								aria-hidden="true"
							/>
							New Snippet
						</Button>
					</div>
				) : snippets.length === 0 ? (
					<div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
						<EmptyStateIcon icon={Search01Icon} />
						<div>
							<p className="text-sm font-medium">No matching snippets</p>
							<p className="text-muted-foreground mt-1 text-xs leading-5">
								Try different search terms or reset the filters.
							</p>
						</div>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => onFilterChange(EMPTY_SNIPPETS_FILTER)}
						>
							Reset search and filters
						</Button>
					</div>
				) : (
					<ul className="flex flex-col gap-1">
						{snippets.map((snippet) => {
							const isActive = snippet.id === activeSnippetId;

							return (
								<li key={snippet.id}>
									<div
										className={cn(
											"group flex items-center gap-1 rounded-lg",
											isActive && "bg-muted",
										)}
									>
										<button
											type="button"
											onClick={() => onSelect(snippet)}
											aria-current={isActive ? "true" : undefined}
											className={cn(
												"hover:bg-muted/70 focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
												isActive && "hover:bg-transparent",
											)}
										>
											<HugeiconsIcon
												icon={FileCodeIcon}
												className="text-muted-foreground size-4 shrink-0"
												aria-hidden="true"
											/>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-medium">
													{snippet.title}
												</span>
												<span className="text-muted-foreground block truncate text-xs">
													<span className="font-mono">{snippet.language}</span>
													{" · "}
													{snippet.category}
												</span>
											</span>
										</button>

										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											className={cn(
												"mr-0.5",
												snippet.isFavorite
													? "text-primary hover:text-primary"
													: "text-muted-foreground hover:text-foreground",
											)}
											title={
												snippet.isFavorite
													? "Remove from favorites"
													: "Add to favorites"
											}
											aria-label={
												snippet.isFavorite
													? `Remove ${snippet.title} from favorites`
													: `Add ${snippet.title} to favorites`
											}
											aria-pressed={snippet.isFavorite}
											onClick={() => onToggleFavorite(snippet)}
										>
											<HugeiconsIcon
												icon={StarIcon}
												className={cn(
													"size-3.5",
													snippet.isFavorite && "fill-current",
												)}
												aria-hidden="true"
											/>
										</Button>

										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											className="text-muted-foreground hover:text-destructive mr-1"
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
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</aside>
	);
}
