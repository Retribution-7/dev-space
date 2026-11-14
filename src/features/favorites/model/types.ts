import type { ToolId } from "@/shared/config/tools";

export type FavoritesRepository = {
	getFavoriteToolIds: () => Promise<ToolId[]>;
	setFavoriteToolIds: (toolIds: ToolId[]) => Promise<void>;
};
