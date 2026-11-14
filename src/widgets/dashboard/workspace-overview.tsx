"use client";

import {
	ApiIcon,
	CodeFolderIcon,
	StarIcon,
	ToolsIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/features/favorites";
import { availableToolsCount } from "@/shared/config/tools";
import { cn } from "@/shared/lib/utils";

type BaseMetric = {
	title: string;
	icon: IconSvgElement;
};

type StaticOverviewMetric = BaseMetric & {
	kind: "static";
	value: number | null;
	description: string;
};

type FavoritesOverviewMetric = BaseMetric & {
	kind: "favorites";
};

type OverviewMetric = StaticOverviewMetric | FavoritesOverviewMetric;

type MetricStatus = "ready" | "loading" | "error";

const metrics: OverviewMetric[] = [
	{
		kind: "static",
		title: "Saved Snippets",
		value: null,
		description: "Will appear after Snippet Manager is implemented.",
		icon: CodeFolderIcon,
	},
	{
		kind: "static",
		title: "API Requests",
		value: null,
		description: "Will appear after API Playground is implemented.",
		icon: ApiIcon,
	},
	{
		kind: "favorites",
		title: "Favorites",
		icon: StarIcon,
	},
	{
		kind: "static",
		title: "Available Tools",
		value: availableToolsCount,
		description: "Tools currently available in DevSpace.",
		icon: ToolsIcon,
	},
];

type MetricCardProps = {
	metric: StaticOverviewMetric;
	status?: MetricStatus;
};

function MetricCard({ metric, status = "ready" }: MetricCardProps) {
	const hasData = status === "ready" && metric.value !== null;
	const isLoading = status === "loading";
	const isError = status === "error";

	return (
		<Card
			aria-busy={isLoading || undefined}
			className={cn(
				"gap-0 py-0 shadow-xs",
				hasData && "ring-primary/20 dark:ring-primary/25",
			)}
		>
			<CardContent className="flex h-full flex-col gap-5 p-5">
				<div className="flex items-start justify-between gap-3">
					<span className="text-sm font-medium">{metric.title}</span>
					<span
						className={cn(
							"grid size-8 shrink-0 place-items-center rounded-lg",
							hasData
								? "bg-primary/10 text-primary"
								: "bg-muted text-muted-foreground",
						)}
					>
						<HugeiconsIcon icon={metric.icon} className="size-4" />
					</span>
				</div>

				<div className="mt-auto">
					<div
						className={cn(
							"flex min-h-8 items-center text-2xl font-semibold tracking-tight tabular-nums",
							!hasData && "text-muted-foreground",
						)}
					>
						{isLoading ? (
							<Skeleton className="h-7 w-12" />
						) : hasData ? (
							metric.value
						) : (
							<>
								<span aria-hidden="true">—</span>
								<span className="sr-only">
									{isError ? "Data unavailable" : "No data yet"}
								</span>
							</>
						)}
					</div>
					<p className="text-muted-foreground mt-1 text-xs leading-5 text-pretty">
						{metric.description}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

type FavoritesMetricProps = {
	metric: FavoritesOverviewMetric;
};

function FavoritesMetric({ metric }: FavoritesMetricProps) {
	const { favoriteIds, isLoading, hasError } = useFavorites();
	const status: MetricStatus = isLoading
		? "loading"
		: hasError
			? "error"
			: "ready";
	const favoriteCount = favoriteIds.length;

	let description = "Tools you've starred for quick access.";

	if (isLoading) {
		description = "Loading your favorite tools.";
	} else if (hasError) {
		description = "Couldn't load favorites. Try refreshing the page.";
	} else if (favoriteCount === 0) {
		description = "Star a tool to keep it within reach.";
	}

	return (
		<MetricCard
			metric={{
				kind: "static",
				title: metric.title,
				value: status === "ready" ? favoriteCount : null,
				description,
				icon: metric.icon,
			}}
			status={status}
		/>
	);
}

export function WorkspaceOverview() {
	return (
		<section
			aria-labelledby="workspace-overview-heading"
			className="flex flex-col gap-4"
		>
			<div className="flex flex-col gap-1">
				<h2
					id="workspace-overview-heading"
					className="text-xl font-semibold tracking-tight"
				>
					Workspace Overview
				</h2>
				<p className="text-muted-foreground text-sm">
					A snapshot of your workspace and available DevSpace tools.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{metrics.map((metric) =>
					metric.kind === "favorites" ? (
						<FavoritesMetric key={metric.title} metric={metric} />
					) : (
						<MetricCard key={metric.title} metric={metric} />
					),
				)}
			</div>
		</section>
	);
}
