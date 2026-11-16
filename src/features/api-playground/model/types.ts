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
