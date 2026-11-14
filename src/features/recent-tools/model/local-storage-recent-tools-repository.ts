import {
	RECENT_TOOLS_LIMIT,
	type RecentToolsRepository,
	type RecentToolVisit,
} from "./types";

const STORAGE_KEY = "devspace:recent-tools";

function isRecentToolVisit(value: unknown): value is RecentToolVisit {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const visit = value as Record<string, unknown>;

	if (
		typeof visit.toolId !== "string" ||
		visit.toolId.length === 0 ||
		typeof visit.visitedAt !== "number" ||
		!Number.isFinite(visit.visitedAt) ||
		visit.visitedAt <= 0
	) {
		return false;
	}

	return !Number.isNaN(new Date(visit.visitedAt).getTime());
}

function normalizeVisits(visits: RecentToolVisit[]): RecentToolVisit[] {
	const latestVisitByTool = new Map<string, RecentToolVisit>();

	for (const visit of visits) {
		const currentVisit = latestVisitByTool.get(visit.toolId);

		if (!currentVisit || visit.visitedAt > currentVisit.visitedAt) {
			latestVisitByTool.set(visit.toolId, visit);
		}
	}

	return [...latestVisitByTool.values()]
		.sort((first, second) => second.visitedAt - first.visitedAt)
		.slice(0, RECENT_TOOLS_LIMIT);
}

function readStoredVisits(): RecentToolVisit[] {
	if (typeof window === "undefined") {
		return [];
	}

	try {
		const storedValue = window.localStorage.getItem(STORAGE_KEY);

		if (!storedValue) {
			return [];
		}

		const parsedValue: unknown = JSON.parse(storedValue);

		if (!Array.isArray(parsedValue)) {
			return [];
		}

		return normalizeVisits(parsedValue.filter(isRecentToolVisit));
	} catch {
		return [];
	}
}

function writeStoredVisits(visits: RecentToolVisit[]) {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
	} catch {
		// Recent history is non-critical when storage is unavailable.
	}
}

export const recentToolsRepository: RecentToolsRepository = {
	async getRecentTools() {
		return readStoredVisits();
	},

	async recordVisit(toolId, visitedAt) {
		if (
			!toolId ||
			!Number.isFinite(visitedAt) ||
			Number.isNaN(new Date(visitedAt).getTime())
		) {
			return;
		}

		writeStoredVisits(
			normalizeVisits([{ toolId, visitedAt }, ...readStoredVisits()]),
		);
	},
};
