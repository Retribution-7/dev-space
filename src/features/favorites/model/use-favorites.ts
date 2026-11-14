"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ToolId } from "@/shared/config/tools";

import { favoritesRepository } from "./local-storage-favorites-repository";

export function useFavorites() {
	const [favoriteIds, setFavoriteIds] = useState<ToolId[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const favoriteIdsRef = useRef<ToolId[]>([]);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		let isActive = true;

		async function loadFavorites() {
			try {
				const storedIds = await favoritesRepository.getFavoriteToolIds();

				if (isActive) {
					favoriteIdsRef.current = storedIds;
					setFavoriteIds(storedIds);
					setHasError(false);
				}
			} catch {
				if (isActive) {
					setHasError(true);
				}
			} finally {
				if (isActive) {
					setIsLoading(false);
				}
			}
		}

		void loadFavorites();

		return () => {
			isActive = false;
			isMountedRef.current = false;
		};
	}, []);

	const isFavorite = useCallback(
		(toolId: ToolId) => favoriteIds.includes(toolId),
		[favoriteIds],
	);

	const toggleFavorite = useCallback((toolId: ToolId) => {
		const previousFavoriteIds = favoriteIdsRef.current;
		const nextFavoriteIds = previousFavoriteIds.includes(toolId)
			? previousFavoriteIds.filter((favoriteId) => favoriteId !== toolId)
			: [toolId, ...previousFavoriteIds];

		favoriteIdsRef.current = nextFavoriteIds;
		setFavoriteIds(nextFavoriteIds);

		void favoritesRepository
			.setFavoriteToolIds(nextFavoriteIds)
			.then(() => {
				if (isMountedRef.current) {
					setHasError(false);
				}
			})
			.catch(() => {
				if (!isMountedRef.current) {
					return;
				}

				if (favoriteIdsRef.current === nextFavoriteIds) {
					favoriteIdsRef.current = previousFavoriteIds;
					setFavoriteIds(previousFavoriteIds);
				}

				setHasError(true);
			});
	}, []);

	return { favoriteIds, isFavorite, toggleFavorite, isLoading, hasError };
}
