import {
	ApiIcon,
	CodeFolderIcon,
	StarIcon,
	ToolsIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import { Card, CardContent } from "@/components/ui/card";
import { availableToolsCount } from "@/shared/config/tools";
import { cn } from "@/shared/lib/utils";

type OverviewMetric = {
	title: string;
	value: number | null;
	description: string;
	icon: IconSvgElement;
};

const metrics: OverviewMetric[] = [
	{
		title: "Saved Snippets",
		value: null,
		description: "Will appear after Snippet Manager is implemented.",
		icon: CodeFolderIcon,
	},
	{
		title: "API Requests",
		value: null,
		description: "Will appear after API Playground is implemented.",
		icon: ApiIcon,
	},
	{
		title: "Favorites",
		value: null,
		description: "Will appear after favorites are implemented.",
		icon: StarIcon,
	},
	{
		title: "Available Tools",
		value: availableToolsCount,
		description: "Tools currently available in DevSpace.",
		icon: ToolsIcon,
	},
];

type MetricCardProps = {
	metric: OverviewMetric;
};

function MetricCard({ metric }: MetricCardProps) {
	const hasData = metric.value !== null;

	return (
		<Card
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
					<p
						className={cn(
							"text-2xl font-semibold tracking-tight tabular-nums",
							!hasData && "text-muted-foreground",
						)}
					>
						{hasData ? (
							metric.value
						) : (
							<>
								<span aria-hidden="true">—</span>
								<span className="sr-only">No data yet</span>
							</>
						)}
					</p>
					<p className="text-muted-foreground mt-1 text-xs leading-5 text-pretty">
						{metric.description}
					</p>
				</div>
			</CardContent>
		</Card>
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
				{metrics.map((metric) => (
					<MetricCard key={metric.title} metric={metric} />
				))}
			</div>
		</section>
	);
}
