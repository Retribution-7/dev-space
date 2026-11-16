"use client";

import { FileBracesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { CodeEditor } from "@/components/ui/code-editor";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import type { RequestBodyType } from "../model/types";

type RequestBodyEditorProps = {
	bodyType: RequestBodyType;
	body: string;
	onBodyTypeChange: (bodyType: RequestBodyType) => void;
	onBodyChange: (body: string) => void;
};

const BODY_TYPE_ITEMS: { value: RequestBodyType; label: string }[] = [
	{ value: "none", label: "None" },
	{ value: "json", label: "JSON" },
	{ value: "text", label: "Text" },
];

const BODY_TYPE_HINTS: Record<Exclude<RequestBodyType, "none">, string> = {
	json: "application/json",
	text: "text/plain",
};

export function RequestBodyEditor({
	bodyType,
	body,
	onBodyTypeChange,
	onBodyChange,
}: RequestBodyEditorProps) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center gap-2">
				<span className="text-muted-foreground text-xs font-medium">
					Body type
				</span>
				<Select
					value={bodyType}
					items={BODY_TYPE_ITEMS}
					onValueChange={(value) => {
						if (value) {
							onBodyTypeChange(value as RequestBodyType);
						}
					}}
				>
					<SelectTrigger
						type="button"
						size="sm"
						className="w-32"
						aria-label="Request body type"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{BODY_TYPE_ITEMS.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<span className="text-muted-foreground ml-auto text-xs">
					{bodyType === "none" ? null : BODY_TYPE_HINTS[bodyType]}
				</span>
			</div>

			{bodyType === "none" ? (
				<div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
					<span className="bg-muted text-muted-foreground grid size-9 place-items-center rounded-full">
						<HugeiconsIcon
							icon={FileBracesIcon}
							className="size-4"
							aria-hidden="true"
						/>
					</span>
					<p className="text-sm font-medium">No request body</p>
					<p className="text-muted-foreground text-xs">
						Choose JSON or Text above to start composing a body.
					</p>
				</div>
			) : (
				<div className="h-[clamp(14rem,32svh,22rem)] overflow-hidden rounded-lg border">
					<CodeEditor
						value={body}
						language={bodyType === "json" ? "json" : ""}
						ariaLabel={
							bodyType === "json"
								? "JSON request body editor"
								: "Text request body editor"
						}
						onChange={onBodyChange}
					/>
				</div>
			)}
		</div>
	);
}
