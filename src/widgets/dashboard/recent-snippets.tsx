"use client";

import { ArrowRight01Icon, FileCodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useRecentSnippets,
	useSnippetsHydration,
} from "@/features/snippet-manager";

const updatedAtFormatter = new Intl.DateTimeFormat("en", {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

function formatUpdatedAt(value: string): string {
	const date = new Date(value);

	return Number.isNaN(date.getTime()) ? value : updatedAtFormatter.format(date);
}

function RecentSnippetsSkeleton() {
	return (
		<div
			role="status"
			aria-label="Loading recent snippets"
			className="flex flex-col gap-1"
		>
			{Array.from({ length: 3 }, (_, index) => (
				<div key={index} className="flex items-center gap-3 px-3 py-2.5">
					<Skeleton className="size-9 shrink-0 rounded-lg" />
					<div className="flex min-w-0 flex-1 flex-col gap-2">
						<Skeleton className="h-3.5 w-40 max-w-full" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>
			))}
		</div>
	);
}

export function RecentSnippets() {
	const snippets = useRecentSnippets();
	const isHydrated = useSnippetsHydration();

	return (
		<section
			aria-labelledby="recent-snippets-heading"
			className="flex flex-col gap-4"
		>
			<div className="flex flex-col gap-1">
				<h2
					id="recent-snippets-heading"
					className="text-xl font-semibold tracking-tight"
				>
					Recent Snippets
				</h2>
				<p className="text-muted-foreground text-sm">
					Your latest saved code fragments, ready to reuse.
				</p>
			</div>

			<Card className="gap-0 py-0 shadow-xs">
				<CardContent className="p-2" aria-busy={!isHydrated}>
					{!isHydrated ? (
						<RecentSnippetsSkeleton />
					) : snippets.length === 0 ? (
						<div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-10 text-center sm:py-12">
							<span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-xl">
								<HugeiconsIcon
									icon={FileCodeIcon}
									className="size-6"
									aria-hidden="true"
								/>
							</span>

							<div className="max-w-sm">
								<h3 className="text-sm font-medium">No snippets yet</h3>
								<p className="text-muted-foreground mt-1 text-xs leading-5 text-pretty">
									Save reusable code in Snippet Manager and your latest snippets
									will appear here.
								</p>
							</div>

							<Link
								href="/snippets"
								className={buttonVariants({ variant: "outline", size: "sm" })}
							>
								Open Snippet Manager
								<HugeiconsIcon
									icon={ArrowRight01Icon}
									className="size-4"
									aria-hidden="true"
								/>
							</Link>
						</div>
					) : (
						<>
							<ul className="flex flex-col gap-1">
								{snippets.map((snippet) => (
									<li key={snippet.id}>
										<Link
											href="/snippets"
											className="group hover:bg-muted/60 focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:ring-3 focus-visible:outline-none"
										>
											<span className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary grid size-9 shrink-0 place-items-center rounded-lg transition-colors">
												<HugeiconsIcon
													icon={FileCodeIcon}
													className="size-4"
													aria-hidden="true"
												/>
											</span>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-medium">
													{snippet.title}
												</span>
												<span className="text-muted-foreground mt-0.5 block truncate text-xs">
													{snippet.language} · Updated{" "}
													{formatUpdatedAt(snippet.updatedAt)}
												</span>
											</span>
											<HugeiconsIcon
												icon={ArrowRight01Icon}
												className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
												aria-hidden="true"
											/>
										</Link>
									</li>
								))}
							</ul>

							<div className="mt-1 flex justify-end border-t px-2 pt-2">
								<Link
									href="/snippets"
									className={buttonVariants({ variant: "ghost", size: "sm" })}
								>
									Open Snippet Manager
									<HugeiconsIcon
										icon={ArrowRight01Icon}
										className="size-4"
										aria-hidden="true"
									/>
								</Link>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</section>
	);
}
