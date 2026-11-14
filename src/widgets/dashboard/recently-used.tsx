"use client";

import {
	AlertCircleIcon,
	ArrowRight01Icon,
	HistoryIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RECENT_TOOLS_LIMIT, useRecentTools } from "@/features/recent-tools";
import { findToolById } from "@/shared/config/tools";

function formatVisitTime(visitedAt: number) {
	const elapsed = Math.max(0, Date.now() - visitedAt);
	const minutes = Math.floor(elapsed / 60_000);

	if (minutes < 1) {
		return "just now";
	}

	if (minutes < 60) {
		return `${minutes} min ago`;
	}

	const hours = Math.floor(minutes / 60);

	if (hours < 24) {
		return `${hours} hr ago`;
	}

	const days = Math.floor(hours / 24);

	if (days === 1) {
		return "yesterday";
	}

	if (days < 7) {
		return `${days} days ago`;
	}

	return new Intl.DateTimeFormat("en", {
		month: "short",
		day: "numeric",
	}).format(visitedAt);
}

function RecentToolsSkeleton() {
	return (
		<div
			role="status"
			aria-label="Loading recently used tools"
			className="flex flex-col gap-1"
		>
			{Array.from({ length: 3 }, (_, index) => (
				<div key={index} className="flex items-center gap-3 px-3 py-2.5">
					<Skeleton className="size-9 shrink-0 rounded-lg" />
					<div className="flex min-w-0 flex-1 flex-col gap-2">
						<Skeleton className="h-3.5 w-32 max-w-full" />
						<Skeleton className="h-3 w-20" />
					</div>
				</div>
			))}
		</div>
	);
}

function RecentToolsEmptyState() {
	return (
		<div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
			<span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-full">
				<HugeiconsIcon
					icon={HistoryIcon}
					className="size-5"
					aria-hidden="true"
				/>
			</span>
			<div>
				<p className="text-sm font-medium">No recent tools yet</p>
				<p className="text-muted-foreground mt-1 text-xs leading-5">
					Tools you open will appear here automatically.
				</p>
			</div>
		</div>
	);
}

function RecentToolsErrorState() {
	return (
		<div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
			<span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-full">
				<HugeiconsIcon
					icon={AlertCircleIcon}
					className="size-5"
					aria-hidden="true"
				/>
			</span>
			<div>
				<p className="text-sm font-medium">Couldn&apos;t load recent tools</p>
				<p className="text-muted-foreground mt-1 text-xs leading-5">
					Try refreshing the page to load your history.
				</p>
			</div>
		</div>
	);
}

export function RecentlyUsed() {
	const { visits, isLoading, hasError } = useRecentTools();
	const recentTools = visits
		.flatMap((visit) => {
			const tool = findToolById(visit.toolId);

			return tool ? [{ tool, visitedAt: visit.visitedAt }] : [];
		})
		.slice(0, RECENT_TOOLS_LIMIT);

	return (
		<section
			aria-labelledby="recently-used-heading"
			className="flex flex-col gap-4"
		>
			<div className="flex flex-col gap-1">
				<h2
					id="recently-used-heading"
					className="text-xl font-semibold tracking-tight"
				>
					Recently Used
				</h2>
				<p className="text-muted-foreground text-sm">
					Pick up where you left off with your latest tools.
				</p>
			</div>

			<Card className="gap-0 py-0 shadow-xs">
				<CardContent className="p-2" aria-busy={isLoading}>
					{isLoading ? (
						<RecentToolsSkeleton />
					) : hasError ? (
						<RecentToolsErrorState />
					) : recentTools.length === 0 ? (
						<RecentToolsEmptyState />
					) : (
						<ul className="flex flex-col gap-1">
							{recentTools.map(({ tool, visitedAt }) => (
								<li key={tool.id}>
									<Link
										href={tool.url}
										className="group hover:bg-muted/60 focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:ring-3 focus-visible:outline-none"
									>
										<span className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary grid size-9 shrink-0 place-items-center rounded-lg transition-colors">
											<HugeiconsIcon
												icon={tool.icon}
												className="size-4"
												aria-hidden="true"
											/>
										</span>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-medium">
												{tool.title}
											</span>
											<time
												dateTime={new Date(visitedAt).toISOString()}
												className="text-muted-foreground mt-0.5 block text-xs"
											>
												Visited {formatVisitTime(visitedAt)}
											</time>
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
					)}
				</CardContent>
			</Card>
		</section>
	);
}
