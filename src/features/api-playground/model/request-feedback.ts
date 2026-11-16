import type { HttpResponse, RequestExecution } from "./types";

export type RequestFeedbackTone = "success" | "error" | "warning" | "info";

export type RequestFeedback = {
	tone: RequestFeedbackTone;
	message: string;
};

export function describeRequestExecution(
	execution: RequestExecution,
): RequestFeedback {
	switch (execution.status) {
		case "success":
			return {
				tone: "success",
				message: describeResponse(execution.response),
			};
		case "http-error":
			return {
				tone: "warning",
				message: describeResponse(execution.response),
			};
		case "network-error":
			return {
				tone: "error",
				message: `${execution.message}${execution.code ? ` (${execution.code})` : ""}`,
			};
		case "timeout":
			return {
				tone: "error",
				message: execution.message,
			};
		case "canceled":
			return {
				tone: "info",
				message: "Request canceled.",
			};
		case "unexpected-error":
			return {
				tone: "error",
				message: `${execution.message}${execution.code ? ` (${execution.code})` : ""}`,
			};
	}
}

export function describeResponse(response: HttpResponse): string {
	const status = response.statusText
		? `HTTP ${response.status} ${response.statusText}`
		: `HTTP ${response.status}`;

	return `Response received: ${status} · ${formatDuration(response.durationMs)} · ${formatBytes(response.sizeBytes)}`;
}

export function formatDuration(durationMs: number): string {
	if (!Number.isFinite(durationMs) || durationMs < 0) {
		return "0 ms";
	}

	if (durationMs < 1000) {
		return `${Math.round(durationMs)} ms`;
	}

	return `${(durationMs / 1000).toFixed(2)} s`;
}

export function formatBytes(sizeBytes: number): string {
	if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
		return "0 B";
	}

	if (sizeBytes < 1024) {
		return `${Math.round(sizeBytes)} B`;
	}

	if (sizeBytes < 1024 * 1024) {
		return `${(sizeBytes / 1024).toFixed(1)} KB`;
	}

	return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
