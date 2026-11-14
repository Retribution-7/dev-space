"use client";

import {
	AlertCircleIcon,
	ArrowRight01Icon,
	StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/features/favorites";
import { findToolById } from "@/shared/config/tools";

function FavoritesSkeleton() {
	return (
		<div
			role="status"
			aria-label="Loading favorite tools"
			className="flex flex-col gap-1"
		>
			{Array.from({ length: 3 }, (_, index) => (
				<div key={index} className="flex items-center gap-3 px-3 py-2.5">
					<Skeleton className="size-9 shrink-0 rounded-lg" />
					<div className="flex min-w-0 flex-1 items-center">
						<Skeleton className="h-3.5 w-32 max-w-full" />
					</div>
				</div>
			))}
		</div>
	);
}

function FavoritesEmptyState() {
	return (
		<div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
			<span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-full">
				<HugeiconsIcon icon={StarIcon} className="size-5" aria-hidden="true" />
			</span>
			<div>
				<p className="text-sm font-medium">No favorites yet</p>
				<p className="text-muted-foreground mt-1 text-xs leading-5">
					Use the star button on any tool page to pin it here.
				</p>
			</div>
		</div>
	);
}

function FavoritesErrorState() {
	return (
		<div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
			<span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-full">
				<HugeiconsIcon
					icon={AlertCircleIcon}
					className="size-5"
					aria-hidden="true"
				/>
			</span>
			<div>
				<p className="text-sm font-medium">Couldn&apos;t load favorites</p>
				<p className="text-muted-foreground mt-1 text-xs leading-5">
					Try refreshing the page to load your favorites.
				</p>
			</div>
		</div>
	);
}

export function Favorites() {
	const { favoriteIds, isLoading, hasError } = useFavorites();
	const favoriteTools = favoriteIds.flatMap((toolId) => {
		const tool = findToolById(toolId);

		return tool ? [tool] : [];
	});

	return (
		<section
			aria-labelledby="favorites-heading"
			className="flex flex-col gap-4"
		>
			<div className="flex flex-col gap-1">
				<h2
					id="favorites-heading"
					className="text-xl font-semibold tracking-tight"
				>
					Favorites
				</h2>
				<p className="text-muted-foreground text-sm">
					Your pinned tools, always within reach.
				</p>
			</div>

			<Card className="gap-0 py-0 shadow-xs">
				<CardContent className="p-2" aria-busy={isLoading}>
					{isLoading ? (
						<FavoritesSkeleton />
					) : hasError ? (
						<FavoritesErrorState />
					) : favoriteTools.length === 0 ? (
						<FavoritesEmptyState />
					) : (
						<ul className="flex flex-col gap-1">
							{favoriteTools.map((tool) => (
								<li key={tool.id}>
									<Link
										href={tool.url}
										className="group hover:bg-muted/60 focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:ring-3 focus-visible:outline-none"
									>
										<span className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary grid size-9 shrink-0 place-items-center rounded-lg transition-colors">
											<HugeiconsIcon
												icon={tool.icon}
												className="size-4"
												aria-hidden="true"
											/>
										</span>
										<span className="min-w-0 flex-1 truncate text-sm font-medium">
											{tool.title}
										</span>
										<HugeiconsIcon
											icon={ArrowRight01Icon}
											className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
											aria-hidden="true"
										/>
									</Link>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</section>
	);
}
