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

export function getLanguageOptions(currentLanguage: string): string[] {
	const language = currentLanguage.trim() || DEFAULT_SNIPPET_LANGUAGE;

	if ((SNIPPET_LANGUAGES as readonly string[]).includes(language)) {
		return [...SNIPPET_LANGUAGES];
	}

	return [...SNIPPET_LANGUAGES, language];
}
