import { parseJson } from "./parse-json";

export type JsonTransformResult =
	| { status: "success"; value: string }
	| { status: "empty" }
	| { status: "invalid"; message: string };

export function transformJson(
	input: string,
	serialize: (value: unknown) => string | undefined,
): JsonTransformResult {
	const result = parseJson(input);

	if (result.status !== "success") {
		return result;
	}

	const transformed = serialize(result.value);

	if (transformed === undefined) {
		return {
			status: "invalid",
			message: "This value cannot be represented as JSON.",
		};
	}

	return { status: "success", value: transformed };
}
