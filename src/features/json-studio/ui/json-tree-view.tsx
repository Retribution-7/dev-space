"use client";

import { ChevronDownIcon, ChevronRightIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

type JsonTreeViewProps = {
	value: unknown;
	className?: string;
};

export function JsonTreeView({ value, className }: JsonTreeViewProps) {
	return (
		<div className={cn("h-full overflow-auto", className)}>
			<div className="px-4 py-3 font-mono text-[0.8125rem] leading-6">
				<JsonTreeItem value={value} />
			</div>
		</div>
	);
}

type JsonTreeItemProps = {
	value: unknown;
	label?: string;
	isIndex?: boolean;
};

function JsonTreeItem({ value, label, isIndex = false }: JsonTreeItemProps) {
	const isBranch = typeof value === "object" && value !== null;
	const [isOpen, setIsOpen] = React.useState(true);

	if (!isBranch) {
		return (
			<div className="flex items-start gap-1.5 whitespace-pre-wrap">
				<span className="size-4 shrink-0" aria-hidden="true" />
				<JsonTreeLabel label={label} isIndex={isIndex} />
				<span
					className={value === null ? "italic" : undefined}
					style={{ color: primitiveColor(value) }}
				>
					{formatPrimitive(value)}
				</span>
			</div>
		);
	}

	const isArray = Array.isArray(value);
	const entries: Array<[string, unknown]> = isArray
		? value.map((item, index): [string, unknown] => [String(index), item])
		: Object.entries(value);
	const isEmpty = entries.length === 0;
	const emptyHint = isArray ? "[]" : "{}";
	const branchHint = isArray ? "[…]" : "{…}";

	return (
		<div>
			<button
				type="button"
				disabled={isEmpty}
				aria-expanded={isEmpty ? undefined : isOpen}
				onClick={() => setIsOpen((open) => !open)}
				className="hover:bg-muted/50 focus-visible:ring-ring/50 flex w-full items-start gap-1.5 rounded-md px-0.5 text-left whitespace-pre-wrap outline-none focus-visible:ring-2 disabled:pointer-events-none"
			>
				<span className="text-muted-foreground grid size-4 shrink-0 place-items-center">
					{isEmpty ? null : (
						<HugeiconsIcon
							icon={isOpen ? ChevronDownIcon : ChevronRightIcon}
							className="size-3.5"
							aria-hidden="true"
						/>
					)}
				</span>
				<JsonTreeLabel label={label} isIndex={isIndex} />
				<span className="text-muted-foreground">
					{isEmpty ? emptyHint : branchHint}
				</span>
			</button>
			{isOpen && !isEmpty ? (
				<div className="pl-5">
					{entries.map(([key, child]) => (
						<JsonTreeItem
							key={key}
							label={key}
							isIndex={isArray}
							value={child}
						/>
					))}
				</div>
			) : null}
		</div>
	);
}

function JsonTreeLabel({
	label,
	isIndex,
}: {
	label?: string;
	isIndex: boolean;
}) {
	if (label === undefined) {
		return null;
	}

	return (
		<span
			className={isIndex ? undefined : "font-medium"}
			style={{
				color: isIndex ? "var(--muted-foreground)" : "var(--syntax-key)",
			}}
		>
			{label}:
		</span>
	);
}

function primitiveColor(value: unknown): string {
	if (typeof value === "string") {
		return "var(--syntax-string)";
	}

	if (typeof value === "number") {
		return "var(--syntax-number)";
	}

	if (typeof value === "boolean") {
		return "var(--syntax-boolean)";
	}

	return "var(--muted-foreground)";
}

function formatPrimitive(value: unknown): string {
	if (typeof value === "string") {
		return JSON.stringify(value) ?? String(value);
	}

	return String(value);
}
