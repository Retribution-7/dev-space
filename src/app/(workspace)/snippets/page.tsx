import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Snippet Manager",
};

export default function SnippetsPage() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div>
				<h2 className="text-xl font-semibold">Snippet Manager</h2>
				<p className="text-muted-foreground text-sm">Coming soon.</p>
			</div>
		</div>
	);
}
