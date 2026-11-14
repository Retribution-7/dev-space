import { ArrowRight01Icon, FileCodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function RecentSnippets() {
	return (
		<section
			aria-labelledby="recent-snippets-heading"
			className="flex flex-col gap-4"
		>
			<div className="flex flex-col gap-1">
				<h2
					id="recent-snippets-heading"
					className="text-xl font-semibold tracking-tight"
				>
					Recent Snippets
				</h2>
				<p className="text-muted-foreground text-sm">
					Your latest saved code fragments, ready to reuse.
				</p>
			</div>

			<Card className="gap-0 py-0 shadow-xs">
				<CardContent className="p-2">
					{/* Snippet Manager will provide the real list: title, language, updated date, and /snippets/[id] links. */}
					<div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-10 text-center sm:py-12">
						<span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-xl">
							<HugeiconsIcon
								icon={FileCodeIcon}
								className="size-6"
								aria-hidden="true"
							/>
						</span>

						<div className="max-w-sm">
							<h3 className="text-sm font-medium">No snippets yet</h3>
							<p className="text-muted-foreground mt-1 text-xs leading-5 text-pretty">
								Save reusable code in Snippet Manager and your latest snippets
								will appear here.
							</p>
						</div>

						<Link
							href="/snippets"
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							Open Snippet Manager
							<HugeiconsIcon
								icon={ArrowRight01Icon}
								className="size-4"
								aria-hidden="true"
							/>
						</Link>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}
