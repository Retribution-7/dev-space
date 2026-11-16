export const HTTP_METHODS = [
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export const REQUEST_BODY_TYPES = ["none", "json", "text"] as const;

export type RequestBodyType = (typeof REQUEST_BODY_TYPES)[number];

export type KeyValueSection = "params" | "headers";

export type KeyValueField = "key" | "value";

export type KeyValueRow = {
	id: string;
	key: string;
	value: string;
};

export type KeyValueEntry = {
	key: string;
	value: string;
};

export type RequestDraft = {
	method: HttpMethod;
	url: string;
	params: KeyValueRow[];
	headers: KeyValueRow[];
	bodyType: RequestBodyType;
	body: string;
};

export type RequestValidationIssueCode =
	"empty-url" | "invalid-url" | "unsupported-protocol" | "invalid-json";

export type RequestValidationIssue = {
	code: RequestValidationIssueCode;
	message: string;
};

export type PreparedHttpRequest = {
	method: HttpMethod;
	url: string;
	params: URLSearchParams;
	headers: Record<string, string>;
	data?: string;
};

export type PrepareRequestResult =
	| { ok: true; request: PreparedHttpRequest }
	| { ok: false; issue: RequestValidationIssue };

export type HttpResponse = {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
	durationMs: number;
	sizeBytes: number;
};

export type RequestExecution =
	| { status: "success"; response: HttpResponse }
	| { status: "http-error"; response: HttpResponse }
	| { status: "network-error"; message: string; code?: string }
	| { status: "canceled" }
	| { status: "unexpected-error"; message: string };
