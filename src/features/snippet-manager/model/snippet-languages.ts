import { DEFAULT_SNIPPET_LANGUAGE } from "./snippet-draft";

/**
 * Language choices offered in the snippet metadata form.
 * Stored snippets with other languages are still supported: their value is
 * added to the options and the editor falls back to plain text mode.
 */
export const SNIPPET_LANGUAGES = [
	DEFAULT_SNIPPET_LANGUAGE,
	"TypeScript",
	"JavaScript",
	"JSON",
	"HTML",
	"CSS",
	"Python",
	"SQL",
] as const;

export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number];

/**
 * Central mapping between supported languages and source file extensions.
 * Adding a language to `SNIPPET_LANGUAGES` requires its extension here.
 */
export const LANGUAGE_FILE_EXTENSIONS: Record<SnippetLanguage, string> = {
	Text: "txt",
	TypeScript: "ts",
	JavaScript: "js",
	JSON: "json",
	HTML: "html",
	CSS: "css",
	Python: "py",
	SQL: "sql",
};

export const DEFAULT_FILE_EXTENSION =
	LANGUAGE_FILE_EXTENSIONS[DEFAULT_SNIPPET_LANGUAGE];

export function getLanguageOptions(currentLanguage: string): string[] {
	const language = currentLanguage.trim() || DEFAULT_SNIPPET_LANGUAGE;

	if ((SNIPPET_LANGUAGES as readonly string[]).includes(language)) {
		return [...SNIPPET_LANGUAGES];
	}

	return [...SNIPPET_LANGUAGES, language];
}

function findLanguage(value: string): SnippetLanguage | null {
	const normalized = value.trim().toLowerCase();

	return (
		SNIPPET_LANGUAGES.find(
			(language) => language.toLowerCase() === normalized,
		) ?? null
	);
}

/** Canonical language name for user-facing values, when it is supported. */
export function normalizeSnippetLanguage(
	value: string,
): SnippetLanguage | null {
	return findLanguage(value);
}

/** File extension (without a dot) for a snippet language. */
export function getFileExtensionForLanguage(language: string): string {
	const known = findLanguage(language);

	return known ? LANGUAGE_FILE_EXTENSIONS[known] : DEFAULT_FILE_EXTENSION;
}

/** Supported language for a file extension (without a dot), if any. */
export function getLanguageForFileExtension(
	extension: string,
): SnippetLanguage | null {
	const normalized = extension.trim().toLowerCase().replace(/^\./, "");

	return (
		SNIPPET_LANGUAGES.find(
			(language) => LANGUAGE_FILE_EXTENSIONS[language] === normalized,
		) ?? null
	);
}

/** Lowercase extension (without a dot) of a file name, or an empty string. */
export function getFileExtensionFromFileName(fileName: string): string {
	const baseName = getPathBaseName(fileName);
	const dotIndex = baseName.lastIndexOf(".");

	if (dotIndex <= 0 || dotIndex === baseName.length - 1) {
		return "";
	}

	return baseName.slice(dotIndex + 1).toLowerCase();
}

/** File name without its extension. */
export function getFileNameWithoutExtension(fileName: string): string {
	const baseName = getPathBaseName(fileName);
	const dotIndex = baseName.lastIndexOf(".");

	return dotIndex <= 0 ? baseName : baseName.slice(0, dotIndex);
}

/** Last segment of a file path, safe for nested archive entries. */
export function getPathBaseName(path: string): string {
	const normalized = path.replace(/\\/g, "/");
	const segments = normalized.split("/");

	return segments[segments.length - 1] ?? "";
}
