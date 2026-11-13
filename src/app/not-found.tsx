"use client";

import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export default function NotFoundPage() {
	const router = useRouter();
	useTheme();

	return (
		<main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16">
			<div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
				<div className="bg-chart-2/20 absolute top-0 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
				<div className="bg-primary/15 absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full blur-3xl" />
				<div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_55%_50%_at_50%_45%,black,transparent)] [background-size:3rem_3rem] opacity-40" />
			</div>

			<div className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
				<span className="relative inline-block font-mono text-[7rem] leading-none font-bold tracking-tighter select-none sm:text-[10rem]">
					<span aria-hidden className="bg-chart-2/30 absolute inset-0 blur-3xl">
						404
					</span>
					<span className="from-primary via-primary/80 to-primary/30 dark:from-chart-1 dark:via-chart-2 dark:to-chart-2/30 relative bg-gradient-to-b bg-clip-text text-transparent">
						404
					</span>
				</span>

				<div className="flex flex-col items-center gap-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Page not found
					</h1>
					<p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
						The page you&apos;re looking for doesn&apos;t exist or may have been
						moved.
					</p>
				</div>

				<div className="flex flex-wrap items-center justify-center gap-3">
					<Button variant="outline" size="lg" onClick={() => router.back()}>
						<ArrowLeft />
						Go back
					</Button>
					<Button size="lg" onClick={() => router.push("/dashboard")}>
						<Home />
						Back to dashboard
					</Button>
				</div>
			</div>
		</main>
	);
}
