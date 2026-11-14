"use client";

import { useEffect, useState } from "react";

import { recentToolsRepository } from "./local-storage-recent-tools-repository";
import type { RecentToolVisit } from "./types";

export function useRecentTools() {
	const [visits, setVisits] = useState<RecentToolVisit[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		let isActive = true;

		async function loadRecentTools() {
			try {
				const storedVisits = await recentToolsRepository.getRecentTools();

				if (isActive) {
					setVisits(storedVisits);
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

		void loadRecentTools();

		return () => {
			isActive = false;
		};
	}, []);

	return { visits, isLoading, hasError };
}
