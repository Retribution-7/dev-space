"use client";

import { useEffect } from "react";
import type { ErrorInfo } from "next/error";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Alert02Icon,
	Home01Icon,
	RefreshIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

function getErrorDigest(error: unknown) {
	if (
		typeof error === "object" &&
		error !== null &&
		"digest" in error &&
		typeof error.digest === "string"
	) {
		return error.digest;
	}

	return undefined;
}

export default function ErrorPage({ error, retry }: ErrorInfo) {
	const digest = getErrorDigest(error);
	useTheme();

	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16">
			<div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
				<div className="bg-destructive/15 absolute top-0 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
				<div className="bg-primary/15 absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full blur-3xl" />
				<div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_55%_50%_at_50%_45%,black,transparent)] [background-size:3rem_3rem] opacity-40" />
			</div>

			<div className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
				<div className="relative flex items-center justify-center">
					<div
						aria-hidden
						className="bg-destructive/25 absolute inset-0 rounded-full blur-2xl"
					/>
					<div className="bg-destructive/10 text-destructive ring-destructive/20 relative flex size-16 items-center justify-center rounded-2xl ring-1">
						<HugeiconsIcon icon={Alert02Icon} className="size-8" />
					</div>
				</div>

				<div className="flex flex-col items-center gap-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Something went wrong
					</h1>
					<p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
						An unexpected error occurred. Try again, or return to the dashboard
						to continue working.
					</p>
				</div>

				{digest ? (
					<p className="bg-muted/50 text-muted-foreground max-w-full truncate rounded-md border px-3 py-1.5 font-mono text-xs">
						Error ID: {digest}
					</p>
				) : null}

				<div className="flex flex-wrap items-center justify-center gap-3">
					<Button variant="outline" size="lg" onClick={() => retry()}>
						<HugeiconsIcon icon={RefreshIcon} />
						Try again
					</Button>
					<Button size="lg" render={<Link href="/dashboard" />}>
						<HugeiconsIcon icon={Home01Icon} />
						Back to dashboard
					</Button>
				</div>
			</div>
		</main>
	);
}
