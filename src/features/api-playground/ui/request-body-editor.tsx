"use client";

import { FileBracesIcon } from "@hugeicons/core-free-icons";

import { CodeEditor } from "@/components/ui/code-editor";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import type { RequestBodyType } from "../model/types";

import { EmptyState } from "./empty-state";

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
				<div className="rounded-lg border border-dashed p-6">
					<EmptyState
						icon={FileBracesIcon}
						title="No request body"
						description="Choose JSON or Text above to start composing a body."
						className="px-0 py-0"
					/>
				</div>
			) : (
				<div className="h-[clamp(14rem,32svh,22rem)] overflow-hidden border">
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
