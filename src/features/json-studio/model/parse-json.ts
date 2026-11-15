export type JsonParseResult =
	| { status: "success"; value: unknown }
	| { status: "empty" }
	| { status: "invalid"; message: string };

export function parseJson(input: string): JsonParseResult {
	if (input.trim().length === 0) {
		return { status: "empty" };
	}

	try {
		return { status: "success", value: JSON.parse(input) };
	} catch (error) {
		return {
			status: "invalid",
			message:
				error instanceof Error ? error.message : "Unknown parsing error.",
		};
	}
}
