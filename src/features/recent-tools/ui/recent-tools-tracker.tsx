"use client";

import { useTrackRecentToolVisits } from "../model/use-track-recent-tool-visits";

export function RecentToolsTracker() {
	useTrackRecentToolVisits();

	return null;
}
