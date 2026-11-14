"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { findToolByPath } from "@/shared/config/tools";

import { recentToolsRepository } from "./local-storage-recent-tools-repository";

export function useTrackRecentToolVisits() {
	const pathname = usePathname();
	const lastTrackedPath = useRef<string | null>(null);

	useEffect(() => {
		const tool = pathname ? findToolByPath(pathname) : undefined;

		if (!tool) {
			lastTrackedPath.current = null;
			return;
		}

		if (lastTrackedPath.current === pathname) {
			return;
		}

		lastTrackedPath.current = pathname;
		void recentToolsRepository.recordVisit(tool.id, Date.now());
	}, [pathname]);
}
