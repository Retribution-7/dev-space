import type { Metadata } from "next";

import { FavoriteToolButton } from "@/features/favorites";

export const metadata: Metadata = {
	title: "API Playground",
};

export default function ApiPlaygroundPage() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold">API Playground</h2>
					<p className="text-muted-foreground text-sm">Coming soon.</p>
				</div>
				<FavoriteToolButton toolId="api-playground" />
			</div>
		</div>
	);
}
