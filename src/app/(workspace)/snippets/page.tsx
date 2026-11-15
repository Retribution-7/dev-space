import type { Metadata } from "next";

import { FavoriteToolButton } from "@/features/favorites";
import { SnippetList } from "@/features/snippet-manager";

export const metadata: Metadata = {
	title: "Snippet Manager",
};

export default function SnippetsPage() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold">Snippet Manager</h2>
					<p className="text-muted-foreground text-sm">
						Your reusable code snippets, all in one place.
					</p>
				</div>
				<FavoriteToolButton toolId="snippet-manager" />
			</div>

			<SnippetList snippets={[]} />
		</div>
	);
}
