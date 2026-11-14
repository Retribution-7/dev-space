import { CodeIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Card, CardContent } from "@/components/ui/card";

export function WelcomeSection() {
	return (
		<section aria-labelledby="welcome-heading">
			<Card className="relative gap-0 py-0 shadow-xs">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 overflow-hidden"
				>
					<div className="from-primary/10 dark:from-primary/15 absolute inset-0 bg-linear-to-br via-transparent to-transparent" />
					<div className="bg-primary/10 absolute -top-24 -right-20 size-64 rounded-full blur-3xl" />
					<div className="bg-primary/5 absolute -bottom-28 left-1/3 size-56 rounded-full blur-3xl" />
					<div className="via-primary/40 absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent" />
				</div>

				<CardContent className="relative flex flex-col gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-10">
					<div className="max-w-2xl">
						<div className="flex items-center gap-2.5">
							<span className="bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-lg shadow-xs">
								<HugeiconsIcon icon={SparklesIcon} className="size-4" />
							</span>
							<span className="text-muted-foreground text-[0.7rem] font-semibold tracking-[0.16em] uppercase">
								Developer Toolkit
							</span>
						</div>

						<h2
							id="welcome-heading"
							className="mt-5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
						>
							Welcome to DevSpace
						</h2>
						<p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6 text-pretty sm:text-base">
							A single workspace for the tools you reach for every day. Format
							JSON, test APIs, debug regular expressions, manage snippets,
							preview Markdown, and explore colors without breaking your flow.
						</p>
					</div>

					<div
						aria-hidden="true"
						className="relative hidden w-64 shrink-0 lg:block"
					>
						<div className="bg-primary/15 absolute -inset-4 rounded-3xl blur-2xl" />
						<div className="bg-background/80 relative overflow-hidden rounded-xl border shadow-sm backdrop-blur">
							<div className="bg-muted/40 flex items-center gap-1.5 border-b px-3.5 py-2.5">
								<span className="bg-primary/70 size-2 rounded-full" />
								<span className="bg-muted-foreground/30 size-2 rounded-full" />
								<span className="bg-muted-foreground/30 size-2 rounded-full" />
								<span className="text-muted-foreground ml-auto font-mono text-[10px]">
									devspace
								</span>
							</div>
							<div className="space-y-0.5 p-4 font-mono text-[11px] leading-5">
								<p className="text-muted-foreground">{"{"}</p>
								<p className="pl-4">
									<span className="text-primary">&quot;workspace&quot;</span>
									<span className="text-muted-foreground">: </span>
									<span className="text-foreground">&quot;unified&quot;</span>
									<span className="text-muted-foreground">,</span>
								</p>
								<p className="pl-4">
									<span className="text-primary">&quot;focus&quot;</span>
									<span className="text-muted-foreground">: </span>
									<span className="text-foreground">&quot;yours&quot;</span>
								</p>
								<p className="text-muted-foreground">{"}"}</p>
							</div>
						</div>
						<div className="bg-card absolute -right-3 -bottom-3 grid size-10 place-items-center rounded-xl border shadow-sm">
							<HugeiconsIcon icon={CodeIcon} className="text-primary size-4" />
						</div>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}
