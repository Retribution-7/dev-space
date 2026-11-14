export type FormatJsonResult =
	| { status: "formatted"; value: string }
	| { status: "empty" }
	| { status: "invalid"; message: string };

const FORMAT_INDENT = 2;

export function formatJson(input: string): FormatJsonResult {
	if (input.trim().length === 0) {
		return { status: "empty" };
	}

	try {
		const parsed: unknown = JSON.parse(input);
		const formatted = JSON.stringify(parsed, null, FORMAT_INDENT);

		if (formatted === undefined) {
			return {
				status: "invalid",
				message: "This value cannot be represented as JSON.",
			};
		}

		return { status: "formatted", value: formatted };
	} catch (error) {
		return {
			status: "invalid",
			message:
				error instanceof Error ? error.message : "Unknown parsing error.",
		};
	}
}
