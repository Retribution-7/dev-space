import type { Metadata } from "next";

import { FavoriteToolButton } from "@/features/favorites";
import { JsonStudio } from "@/features/json-studio";

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

			<JsonStudio initialValue={initialJson} />
		</div>
	);
}
