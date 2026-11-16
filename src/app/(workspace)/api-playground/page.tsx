import type { Metadata } from "next";

import { ApiPlayground } from "@/features/api-playground";
import { FavoriteToolButton } from "@/features/favorites";

export const metadata: Metadata = {
	title: "API Playground",
};

export default function ApiPlaygroundPage() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="flex flex-col gap-1">
				<div className="flex items-center justify-between gap-4">
					<h2 className="text-xl font-semibold tracking-tight">
						API Playground
					</h2>
					<FavoriteToolButton toolId="api-playground" />
				</div>
				<p className="text-muted-foreground text-sm">
					Compose HTTP requests with headers, query parameters, and a body.
				</p>
			</div>

			<ApiPlayground />
		</div>
	);
}
