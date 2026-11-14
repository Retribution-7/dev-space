import { FileBracesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { JsonEditor } from "@/components/ui/json-editor";
import { FavoriteToolButton } from "@/features/favorites";

export const metadata: Metadata = {
	title: "JSON Studio",
};

const initialJson = `{
  "project": "DevSpace",
  "version": "0.1.0",
  "tools": [
    "JSON Studio",
    "Snippet Manager",
    "API Playground"
  ],
  "preferences": {
    "theme": "system",
    "lineWrapping": true
  }
}`;

export default function JsonPage() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h2 className="text-xl font-semibold tracking-tight">JSON Studio</h2>
					<p className="text-muted-foreground text-sm">
						Edit and inspect JSON with syntax highlighting and a focused
						workspace.
					</p>
				</div>
				<FavoriteToolButton toolId="json-studio" />
			</div>

			<Card className="gap-0 py-0 shadow-xs">
				<CardHeader className="flex flex-row items-center gap-3 border-b">
					<span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
						<HugeiconsIcon
							icon={FileBracesIcon}
							className="size-4"
							aria-hidden="true"
						/>
					</span>
					<div className="min-w-0 flex-1">
						<CardTitle className="text-sm">JSON Editor</CardTitle>
						<CardDescription className="text-xs">
							Syntax highlighting, line numbers, and word wrap are enabled.
						</CardDescription>
					</div>
					<span className="bg-muted text-muted-foreground hidden rounded-md border px-2 py-1 font-mono text-[0.7rem] sm:inline-flex">
						JSON
					</span>
				</CardHeader>
				<CardContent className="p-0">
					<JsonEditor
						ariaLabel="JSON document editor"
						className="h-[clamp(20rem,calc(100svh-16rem),44rem)]"
						initialValue={initialJson}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
