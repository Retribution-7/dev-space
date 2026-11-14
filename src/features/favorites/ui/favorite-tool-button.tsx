"use client";

import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { findToolById, type ToolId } from "@/shared/config/tools";
import { cn } from "@/shared/lib/utils";

import { useFavorites } from "../model/use-favorites";

type FavoriteToolButtonProps = {
	toolId: ToolId;
	className?: string;
};

export function FavoriteToolButton({
	toolId,
	className,
}: FavoriteToolButtonProps) {
	const tool = findToolById(toolId);
	const { isFavorite, toggleFavorite, isLoading } = useFavorites();
	const favorite = isFavorite(toolId);
	const label = favorite
		? `Remove ${tool?.title ?? "tool"} from favorites`
		: `Add ${tool?.title ?? "tool"} to favorites`;

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className={cn(
				"text-muted-foreground",
				favorite && "text-primary hover:text-primary",
				className,
			)}
			aria-label={label}
			aria-pressed={favorite}
			title={label}
			disabled={isLoading}
			onClick={() => toggleFavorite(toolId)}
		>
			<HugeiconsIcon
				icon={StarIcon}
				className={cn("size-4", favorite && "fill-current")}
				aria-hidden="true"
			/>
		</Button>
	);
}
