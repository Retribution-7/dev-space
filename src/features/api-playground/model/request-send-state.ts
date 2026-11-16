import type { RequestExecution, RequestValidationIssue } from "./types";

export type RequestSendState = {
	isSending: boolean;
	execution: RequestExecution | null;
	validationIssue: RequestValidationIssue | null;
};

export type RequestSendAction =
	| { type: "start" }
	| { type: "validation-failed"; issue: RequestValidationIssue }
	| { type: "settled"; execution: RequestExecution }
	| { type: "clear-validation" };

export function createRequestSendState(): RequestSendState {
	return {
		isSending: false,
		execution: null,
		validationIssue: null,
	};
}

export function requestSendReducer(
	state: RequestSendState,
	action: RequestSendAction,
): RequestSendState {
	switch (action.type) {
		case "start":
			return {
				isSending: true,
				execution: state.execution,
				validationIssue: null,
			};
		case "validation-failed":
			return {
				isSending: false,
				execution: state.execution,
				validationIssue: action.issue,
			};
		case "settled":
			return {
				isSending: false,
				execution: action.execution,
				validationIssue: null,
			};
		case "clear-validation":
			return state.validationIssue
				? { ...state, validationIssue: null }
				: state;
	}
}
