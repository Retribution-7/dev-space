"use client";

import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";

import type { KeyValueField, KeyValueRow } from "../model/types";

import { EmptyState } from "./empty-state";

type KeyValueEditorProps = {
	rows: KeyValueRow[];
	icon: IconSvgElement;
	itemLabel: string;
	emptyTitle: string;
	emptyDescription: string;
	addLabel: string;
	onAdd: () => void;
	onChange: (id: string, field: KeyValueField, value: string) => void;
	onRemove: (id: string) => void;
};

const ROW_GRID = "grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_1.75rem]";

export function KeyValueEditor({
	rows,
	icon,
	itemLabel,
	emptyTitle,
	emptyDescription,
	addLabel,
	onAdd,
	onChange,
	onRemove,
}: KeyValueEditorProps) {
	if (rows.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-6">
				<EmptyState
					icon={icon}
					title={emptyTitle}
					description={emptyDescription}
					className="px-0 py-0"
					action={
						<Button type="button" variant="outline" size="sm" onClick={onAdd}>
							<HugeiconsIcon
								icon={PlusSignIcon}
								className="size-4"
								data-icon="inline-start"
								aria-hidden="true"
							/>
							{addLabel}
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-muted-foreground text-xs">
					Rows without a key are ignored.
				</p>
				<Button type="button" variant="outline" size="sm" onClick={onAdd}>
					<HugeiconsIcon
						icon={PlusSignIcon}
						className="size-3.5"
						data-icon="inline-start"
						aria-hidden="true"
					/>
					{addLabel}
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				<div
					className={cn(
						"text-muted-foreground hidden gap-2 px-0.5 text-xs font-medium sm:grid",
						ROW_GRID,
					)}
				>
					<span>Key</span>
					<span>Value</span>
					<span className="sr-only">Actions</span>
				</div>

				{rows.map((row, index) => (
					<div key={row.id} className={cn("grid items-center gap-2", ROW_GRID)}>
						<Input
							value={row.key}
							onChange={(event) => onChange(row.id, "key", event.target.value)}
							placeholder="Key"
							aria-label={`${itemLabel} ${index + 1} key`}
							autoComplete="off"
							spellCheck={false}
							className="font-mono text-xs"
						/>
						<Input
							value={row.value}
							onChange={(event) =>
								onChange(row.id, "value", event.target.value)
							}
							placeholder="Value"
							aria-label={`${itemLabel} ${index + 1} value`}
							autoComplete="off"
							spellCheck={false}
							className="font-mono text-xs"
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="text-muted-foreground hover:text-destructive"
							aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
							onClick={() => onRemove(row.id)}
						>
							<HugeiconsIcon
								icon={Delete02Icon}
								className="size-3.5"
								aria-hidden="true"
							/>
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}
