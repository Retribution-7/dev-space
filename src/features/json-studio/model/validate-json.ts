import { transformJson } from "./transform-json";

export type ValidateJsonResult =
	| { status: "valid" }
	| { status: "empty" }
	| { status: "invalid"; message: string };

export function validateJson(input: string): ValidateJsonResult {
	const result = transformJson(input, () => "");
	return result.status === "success" ? { status: "valid" } : result;
}
