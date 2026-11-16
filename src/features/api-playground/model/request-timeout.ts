export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export const REQUEST_TIMEOUT_OPTIONS = [
	{ value: 10_000, label: "10 s" },
	{ value: DEFAULT_REQUEST_TIMEOUT_MS, label: "30 s" },
	{ value: 60_000, label: "60 s" },
	{ value: 120_000, label: "120 s" },
] as const;
