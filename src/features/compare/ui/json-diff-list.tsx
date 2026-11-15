import { CheckmarkCircleIcon, FileDiffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

import type { JsonDifference, JsonDifferenceType } from "../model/types";

type JsonDiffListProps = {
	differences: JsonDifference[];
	className?: string;
};

type DifferenceStyle = {
	label: string;
	badgeClassName: string;
};

const DIFFERENCE_STYLES = {
	added: {
		label: "Added",
		badgeClassName:
			"border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:text-emerald-300",
	},
	removed: {
		label: "Removed",
		badgeClassName:
			"border-rose-500/25 bg-rose-500/10 text-rose-700 dark:border-rose-400/25 dark:text-rose-300",
	},
	changed: {
		label: "Changed",
		badgeClassName:
			"border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:text-amber-300",
	},
} satisfies Record<JsonDifferenceType, DifferenceStyle>;

const DIFFERENCE_TYPES = ["added", "removed", "changed"] as const;

export function JsonDiffList({ differences, className }: JsonDiffListProps) {
	if (differences.length === 0) {
		return (
			<Card className={cn("gap-0 py-0 shadow-xs", className)}>
				<CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
					<span className="grid size-11 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
						<HugeiconsIcon
							icon={CheckmarkCircleIcon}
							className="size-6"
							aria-hidden="true"
						/>
					</span>
					<div>
						<p className="text-sm font-medium">No differences found</p>
						<p className="text-muted-foreground mt-1 text-sm">
							The documents are structurally identical.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const counts = countDifferences(differences);
	const summary =
		differences.length === 1
			? "1 difference found."
			: `${differences.length} differences found.`;

	return (
		<Card
			role="region"
			aria-label="JSON comparison result"
			className={cn("gap-0 py-0 shadow-xs", className)}
		>
			<CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b">
				<span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
					<HugeiconsIcon
						icon={FileDiffIcon}
						className="size-4"
						aria-hidden="true"
					/>
				</span>
				<div className="min-w-0 flex-1">
					<CardTitle className="text-sm">Comparison Result</CardTitle>
					<CardDescription className="text-xs">
						{summary} Values are compared by property path and array index.
					</CardDescription>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					{DIFFERENCE_TYPES.map((type) =>
						counts[type] > 0 ? (
							<span
								key={type}
								className={cn(
									"inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.7rem] font-medium",
									DIFFERENCE_STYLES[type].badgeClassName,
								)}
							>
								{DIFFERENCE_STYLES[type].label}
								<span className="font-mono tabular-nums">{counts[type]}</span>
							</span>
						) : null,
					)}
				</div>
			</CardHeader>
			<CardContent className="p-0">
				<ul className="divide-y">
					{differences.map((difference, index) => (
						<DifferenceItem
							key={`${difference.type}-${difference.path}-${index}`}
							difference={difference}
						/>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}

function DifferenceItem({ difference }: { difference: JsonDifference }) {
	const style = DIFFERENCE_STYLES[difference.type];

	return (
		<li className="flex flex-col gap-2 px-4 py-3.5">
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={cn(
						"inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-medium",
						style.badgeClassName,
					)}
				>
					{style.label}
				</span>
				<code className="bg-muted/60 text-foreground max-w-full rounded-md border px-1.5 py-0.5 font-mono text-[0.75rem] break-all">
					{difference.path}
				</code>
			</div>
			<div
				className={cn(
					"grid gap-2",
					difference.type === "changed" && "sm:grid-cols-2",
				)}
			>
				{difference.type !== "added" ? (
					<ValuePanel
						label="Original value"
						value={difference.oldValue}
						labelClassName="text-rose-700 dark:text-rose-300"
					/>
				) : null}
				{difference.type !== "removed" ? (
					<ValuePanel
						label="New value"
						value={difference.newValue}
						labelClassName="text-emerald-700 dark:text-emerald-300"
					/>
				) : null}
			</div>
		</li>
	);
}

function ValuePanel({
	label,
	value,
	labelClassName,
}: {
	label: string;
	value: unknown;
	labelClassName: string;
}) {
	return (
		<div className="bg-muted/30 overflow-hidden rounded-lg border">
			<div className="border-b px-3 py-1.5">
				<span
					className={cn(
						"text-[0.7rem] font-medium tracking-wide uppercase",
						labelClassName,
					)}
				>
					{label}
				</span>
			</div>
			<pre className="max-h-56 overflow-auto px-3 py-2 font-mono text-xs leading-5 break-all whitespace-pre-wrap">
				{formatDifferenceValue(value)}
			</pre>
		</div>
	);
}

function countDifferences(
	differences: JsonDifference[],
): Record<JsonDifferenceType, number> {
	const counts: Record<JsonDifferenceType, number> = {
		added: 0,
		removed: 0,
		changed: 0,
	};

	for (const difference of differences) {
		counts[difference.type] += 1;
	}

	return counts;
}

function formatDifferenceValue(value: unknown): string {
	return JSON.stringify(value, null, 2) ?? String(value);
}
