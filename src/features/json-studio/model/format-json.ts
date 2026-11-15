import { type JsonTransformResult, transformJson } from "./transform-json";

export type FormatJsonResult = JsonTransformResult;

const FORMAT_INDENT = 2;

export function formatJson(input: string): FormatJsonResult {
	return transformJson(input, (value) =>
		JSON.stringify(value, null, FORMAT_INDENT),
	);
}
