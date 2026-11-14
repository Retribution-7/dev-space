import { type JsonTransformResult, transformJson } from "./transform-json";

export type MinifyJsonResult = JsonTransformResult;

export function minifyJson(input: string): MinifyJsonResult {
	return transformJson(input, (value) => JSON.stringify(value));
}
