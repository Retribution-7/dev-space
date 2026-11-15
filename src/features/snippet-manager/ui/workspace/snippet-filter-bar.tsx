"use client";

import {
	Calendar01Icon,
	Cancel01Icon,
	Search01Icon,
	StarIcon,
	TagsIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { cn } from "@/shared/lib/utils";

import {
	ALL_TIME_DATE_RANGE,
	countActiveFilters,
	createCustomDateRange,
	EMPTY_SNIPPETS_FILTER,
	isFilterActive,
	type SnippetsDateRange,
	type SnippetsFilterState,
} from "../../model/snippets-filter";
import {
	SNIPPET_SORT_OPTIONS,
	type SnippetsSortOption,
} from "../../model/snippets-sort";

const ALL_LANGUAGES_VALUE = "";
const ALL_LANGUAGES_LABEL = "All Languages";

const DATE_RANGE_PRESETS: { label: string; days: number | null }[] = [
	{ label: "All Time", days: null },
	{ label: "Last 7 Days", days: 7 },
	{ label: "Last 30 Days", days: 30 },
];

const shortDateFormatter = new Intl.DateTimeFormat("en", {
	month: "short",
	day: "numeric",
});

function formatDateRangeLabel(dateRange: SnippetsDateRange): string {
	switch (dateRange.type) {
		case "all":
			return "All Time";
		case "last-days":
			return `Last ${dateRange.days} Days`;
		case "custom":
			return `${shortDateFormatter.format(dateRange.from)} – ${shortDateFormatter.format(dateRange.to)}`;
	}
}

function formatCount(count: number, singular: string, plural: string): string {
	return `${count} ${count === 1 ? singular : plural}`;
}

function ToggleChip({
	selected,
	onClick,
	children,
}: {
	selected: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			aria-pressed={selected}
			onClick={onClick}
			className={cn(
				"rounded-md border px-2 py-0.5 text-xs transition-colors",
				selected
					? "border-primary/40 bg-primary/10 text-primary"
					: "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			{children}
		</button>
	);
}

type SnippetFilterBarProps = {
	filter: SnippetsFilterState;
	sort: SnippetsSortOption;
	availableLanguages: string[];
	availableTags: string[];
	totalCount: number;
	resultCount: number;
	onFilterChange: (filter: SnippetsFilterState) => void;
	onSortChange: (sort: SnippetsSortOption) => void;
};

export function SnippetFilterBar({
	filter,
	sort,
	availableLanguages,
	availableTags,
	totalCount,
	resultCount,
	onFilterChange,
	onSortChange,
}: SnippetFilterBarProps) {
	const [pendingRange, setPendingRange] = React.useState<DateRange | undefined>(
		undefined,
	);
	const activeFilterCount = countActiveFilters(filter);
	const isActive = isFilterActive(filter);

	const selectedRange: DateRange | undefined =
		filter.dateRange.type === "custom"
			? { from: filter.dateRange.from, to: filter.dateRange.to }
			: pendingRange;

	function toggleTag(tag: string) {
		const isSelected = filter.tags.some(
			(item) => item.toLowerCase() === tag.toLowerCase(),
		);

		onFilterChange({
			...filter,
			tags: isSelected
				? filter.tags.filter((item) => item.toLowerCase() !== tag.toLowerCase())
				: [...filter.tags, tag],
		});
	}

	function selectDatePreset(days: number | null) {
		setPendingRange(undefined);
		onFilterChange({
			...filter,
			dateRange:
				days === null ? ALL_TIME_DATE_RANGE : { type: "last-days", days },
		});
	}

	function handleRangeSelect(range: DateRange | undefined) {
		setPendingRange(range);

		if (range?.from && range?.to) {
			onFilterChange({
				...filter,
				dateRange: createCustomDateRange(range.from, range.to),
			});
			setPendingRange(undefined);
		}
	}

	function resetAll() {
		setPendingRange(undefined);
		onFilterChange(EMPTY_SNIPPETS_FILTER);
	}

	return (
		<div className="flex flex-col gap-1.5 border-b p-2">
			<div className="relative">
				<HugeiconsIcon
					icon={Search01Icon}
					className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
					aria-hidden="true"
				/>
				<Input
					type="text"
					value={filter.query}
					onChange={(event) =>
						onFilterChange({ ...filter, query: event.target.value })
					}
					placeholder="Search snippets..."
					aria-label="Search snippets"
					className="h-7 pr-7 pl-8 text-sm"
				/>
				{filter.query !== "" ? (
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 -translate-y-1/2"
						title="Clear search"
						aria-label="Clear search"
						onClick={() => onFilterChange({ ...filter, query: "" })}
					>
						<HugeiconsIcon
							icon={Cancel01Icon}
							className="size-3"
							aria-hidden="true"
						/>
					</Button>
				) : null}
			</div>

			<Select
				value={sort}
				onChange={(event) =>
					onSortChange(event.target.value as SnippetsSortOption)
				}
				aria-label="Sort snippets"
				className="h-7 px-2 text-xs md:text-xs"
			>
				{SNIPPET_SORT_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</Select>

			<div className="grid grid-cols-2 gap-1.5">
				<Select
					value={filter.language ?? ALL_LANGUAGES_VALUE}
					onChange={(event) =>
						onFilterChange({
							...filter,
							language:
								event.target.value === ALL_LANGUAGES_VALUE
									? null
									: event.target.value,
						})
					}
					aria-label="Filter by language"
					className="h-7 px-2 text-xs md:text-xs"
				>
					<option value={ALL_LANGUAGES_VALUE}>{ALL_LANGUAGES_LABEL}</option>
					{availableLanguages.map((language) => (
						<option key={language} value={language}>
							{language}
						</option>
					))}
				</Select>

				<Popover
					onOpenChange={(open) => {
						if (!open) {
							setPendingRange(undefined);
						}
					}}
				>
					<PopoverTrigger
						render={
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-full min-w-0"
							/>
						}
					>
						<HugeiconsIcon
							icon={Calendar01Icon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						<span className="truncate">
							{formatDateRangeLabel(filter.dateRange)}
						</span>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-auto gap-2">
						<div className="flex flex-wrap gap-1">
							{DATE_RANGE_PRESETS.map((preset) => (
								<ToggleChip
									key={preset.label}
									selected={
										preset.days === null
											? filter.dateRange.type === "all"
											: filter.dateRange.type === "last-days" &&
												filter.dateRange.days === preset.days
									}
									onClick={() => selectDatePreset(preset.days)}
								>
									{preset.label}
								</ToggleChip>
							))}
						</div>

						<Calendar
							mode="range"
							selected={selectedRange}
							onSelect={handleRangeSelect}
							numberOfMonths={1}
						/>
					</PopoverContent>
				</Popover>
			</div>

			<div className="flex items-center gap-1.5">
				<Popover>
					<PopoverTrigger
						render={
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="min-w-0 flex-1"
							/>
						}
					>
						<HugeiconsIcon
							icon={TagsIcon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						<span className="truncate">Tags</span>
						{filter.tags.length > 0 ? (
							<span className="bg-primary/10 text-primary rounded px-1 text-[0.65rem] font-medium">
								{filter.tags.length}
							</span>
						) : null}
					</PopoverTrigger>
					<PopoverContent align="start" className="w-64">
						<p className="text-muted-foreground px-2 py-1 text-xs">
							Match all selected tags
						</p>
						<div className="flex max-h-48 flex-wrap gap-1 overflow-y-auto p-1">
							{availableTags.length === 0 ? (
								<p className="text-muted-foreground px-2 py-1 text-xs">
									No tags saved yet.
								</p>
							) : (
								availableTags.map((tag) => (
									<ToggleChip
										key={tag}
										selected={filter.tags.some(
											(item) => item.toLowerCase() === tag.toLowerCase(),
										)}
										onClick={() => toggleTag(tag)}
									>
										{tag}
									</ToggleChip>
								))
							)}
						</div>
						{filter.tags.length > 0 ? (
							<div className="mt-1 border-t pt-1">
								<Button
									type="button"
									variant="ghost"
									size="xs"
									onClick={() => onFilterChange({ ...filter, tags: [] })}
								>
									Clear tags
								</Button>
							</div>
						) : null}
					</PopoverContent>
				</Popover>

				<Button
					type="button"
					variant={filter.favoritesOnly ? "default" : "outline"}
					size="sm"
					aria-pressed={filter.favoritesOnly}
					title={
						filter.favoritesOnly
							? "Show all snippets"
							: "Show favorite snippets only"
					}
					onClick={() =>
						onFilterChange({
							...filter,
							favoritesOnly: !filter.favoritesOnly,
						})
					}
				>
					<HugeiconsIcon
						icon={StarIcon}
						className={cn("size-3.5", filter.favoritesOnly && "fill-current")}
						data-icon="inline-start"
						aria-hidden="true"
					/>
					Favorites
				</Button>
			</div>

			<div className="flex items-center justify-between gap-2">
				<p className="text-muted-foreground text-xs">
					{resultCount === totalCount
						? formatCount(totalCount, "snippet", "snippets")
						: `${resultCount} of ${formatCount(totalCount, "snippet", "snippets")}`}
					{activeFilterCount > 0
						? ` · ${formatCount(activeFilterCount, "filter", "filters")}`
						: ""}
				</p>

				{isActive ? (
					<Button type="button" variant="ghost" size="xs" onClick={resetAll}>
						Reset
					</Button>
				) : null}
			</div>
		</div>
	);
}
