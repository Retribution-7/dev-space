export type JsonTransformResult =
	| { status: "success"; value: string }
	| { status: "empty" }
	| { status: "invalid"; message: string };

export function transformJson(
	input: string,
	serialize: (value: unknown) => string | undefined,
): JsonTransformResult {
	if (input.trim().length === 0) {
		return { status: "empty" };
	}

	try {
		const parsed: unknown = JSON.parse(input);
		const transformed = serialize(parsed);

		if (transformed === undefined) {
			return {
				status: "invalid",
				message: "This value cannot be represented as JSON.",
			};
		}

		return { status: "success", value: transformed };
	} catch (error) {
		return {
			status: "invalid",
			message:
				error instanceof Error ? error.message : "Unknown parsing error.",
		};
	}
}
