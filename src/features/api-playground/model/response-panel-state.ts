import type { HttpResponse, RequestExecution } from "./types";

export type ResponsePanelView =
	| { kind: "empty" }
	| { kind: "loading" }
	| { kind: "response"; response: HttpResponse }
	| { kind: "network-error"; message: string; code?: string }
	| { kind: "canceled" }
	| { kind: "unexpected-error"; message: string };

/**
 * Derives what the Response panel should show. Loading takes precedence over
 * the previous execution so a stale response is never presented as the result
 * of a new request.
 */
export function getResponsePanelView(
	execution: RequestExecution | null,
	isSending: boolean,
): ResponsePanelView {
	if (isSending) {
		return { kind: "loading" };
	}

	if (!execution) {
		return { kind: "empty" };
	}

	switch (execution.status) {
		case "success":
		case "http-error":
			return { kind: "response", response: execution.response };
		case "network-error":
			return {
				kind: "network-error",
				message: execution.message,
				code: execution.code,
			};
		case "canceled":
			return { kind: "canceled" };
		case "unexpected-error":
			return { kind: "unexpected-error", message: execution.message };
	}
}
