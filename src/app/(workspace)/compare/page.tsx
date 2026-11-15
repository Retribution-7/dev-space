import type { Metadata } from "next";

import { CompareStudio } from "@/features/compare";
import { FavoriteToolButton } from "@/features/favorites";

export const metadata: Metadata = {
	title: "Compare",
};

export default function ComparePage() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h2 className="text-xl font-semibold tracking-tight">Compare</h2>
					<p className="text-muted-foreground text-sm">
						Compare two JSON documents and inspect added, removed, and changed
						values.
					</p>
				</div>
				<FavoriteToolButton toolId="compare" />
			</div>

			<CompareStudio />
		</div>
	);
}
