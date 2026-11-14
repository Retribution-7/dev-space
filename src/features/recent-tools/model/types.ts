export const RECENT_TOOLS_LIMIT = 3;

export type RecentToolVisit = {
	toolId: string;
	visitedAt: number;
};

export type RecentToolsRepository = {
	getRecentTools: () => Promise<RecentToolVisit[]>;
	recordVisit: (toolId: string, visitedAt: number) => Promise<void>;
};
