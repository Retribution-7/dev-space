import { parseJson } from "@/features/json-studio";

import type {
	CompareDocument,
	CompareDocumentIssue,
	CompareJsonResult,
	JsonDifference,
} from "./types";

const ROOT_PATH = "$";

const JSON_IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function compareJson(
	originalInput: string,
	modifiedInput: string,
): CompareJsonResult {
	const original = parseJson(originalInput);
	const modified = parseJson(modifiedInput);
	const issues: CompareDocumentIssue[] = [];

	collectParseIssue("original", original, issues);
	collectParseIssue("modified", modified, issues);

	if (original.status !== "success" || modified.status !== "success") {
		return { status: "error", issues };
	}

	const differences: JsonDifference[] = [];

	collectDifferences(original.value, modified.value, ROOT_PATH, differences);

	return { status: "success", differences };
}

function collectParseIssue(
	document: CompareDocument,
	result: ReturnType<typeof parseJson>,
	issues: CompareDocumentIssue[],
) {
	if (result.status === "empty") {
		issues.push({ document, reason: "empty" });
		return;
	}

	if (result.status === "invalid") {
		issues.push({ document, reason: "invalid", message: result.message });
	}
}

function collectDifferences(
	original: unknown,
	modified: unknown,
	path: string,
	differences: JsonDifference[],
) {
	if (Array.isArray(original) && Array.isArray(modified)) {
		collectArrayDifferences(original, modified, path, differences);
		return;
	}

	if (isJsonObject(original) && isJsonObject(modified)) {
		collectObjectDifferences(original, modified, path, differences);
		return;
	}

	if (Object.is(original, modified)) {
		return;
	}

	differences.push({
		type: "changed",
		path,
		oldValue: original,
		newValue: modified,
	});
}

function collectObjectDifferences(
	original: Record<string, unknown>,
	modified: Record<string, unknown>,
	path: string,
	differences: JsonDifference[],
) {
	for (const key of Object.keys(original)) {
		const keyPath = appendObjectKey(path, key);

		if (!Object.prototype.hasOwnProperty.call(modified, key)) {
			differences.push({
				type: "removed",
				path: keyPath,
				oldValue: original[key],
			});
			continue;
		}

		collectDifferences(original[key], modified[key], keyPath, differences);
	}

	for (const key of Object.keys(modified)) {
		if (Object.prototype.hasOwnProperty.call(original, key)) {
			continue;
		}

		differences.push({
			type: "added",
			path: appendObjectKey(path, key),
			newValue: modified[key],
		});
	}
}

function collectArrayDifferences(
	original: unknown[],
	modified: unknown[],
	path: string,
	differences: JsonDifference[],
) {
	const length = Math.max(original.length, modified.length);

	for (let index = 0; index < length; index += 1) {
		const indexPath = `${path}[${index}]`;
		const hasOriginalItem = index < original.length;
		const hasModifiedItem = index < modified.length;

		if (hasOriginalItem && hasModifiedItem) {
			collectDifferences(
				original[index],
				modified[index],
				indexPath,
				differences,
			);
			continue;
		}

		if (hasModifiedItem) {
			differences.push({
				type: "added",
				path: indexPath,
				newValue: modified[index],
			});
			continue;
		}

		differences.push({
			type: "removed",
			path: indexPath,
			oldValue: original[index],
		});
	}
}

function appendObjectKey(path: string, key: string): string {
	return JSON_IDENTIFIER_PATTERN.test(key)
		? `${path}.${key}`
		: `${path}[${JSON.stringify(key)}]`;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
