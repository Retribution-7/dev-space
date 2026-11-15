import { strToU8, zipSync } from "fflate";

import { getFileExtensionForLanguage } from "./snippet-languages";
import type { Snippet } from "./types";

export const SNIPPETS_EXPORT_FORMAT = "devspace-snippets";
export const SNIPPETS_EXPORT_VERSION = 1;

export type SnippetsExportDocument = {
	format: typeof SNIPPETS_EXPORT_FORMAT;
	version: typeof SNIPPETS_EXPORT_VERSION;
	exportedAt: string;
	snippets: Snippet[];
};

/**
 * Builds the versioned export document from the saved snippets.
 * The source collection is never mutated and no UI state is included.
 */
export function buildSnippetsExportDocument(
	snippets: Snippet[],
	exportedAt: Date = new Date(),
): SnippetsExportDocument {
	return {
		format: SNIPPETS_EXPORT_FORMAT,
		version: SNIPPETS_EXPORT_VERSION,
		exportedAt: exportedAt.toISOString(),
		snippets: snippets.map((snippet) => ({
			...snippet,
			tags: [...snippet.tags],
		})),
	};
}

export function serializeSnippetsExportDocument(
	document: SnippetsExportDocument,
): string {
	return JSON.stringify(document, null, 2);
}

function formatDateStamp(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function buildSnippetsExportFileName(date: Date = new Date()): string {
	return `devspace-snippets-${formatDateStamp(date)}.json`;
}

export function buildCodeExportArchiveName(date: Date = new Date()): string {
	return `devspace-snippets-${formatDateStamp(date)}.zip`;
}

/** Removes characters that are unsafe in file names. */
export function sanitizeFileName(title: string): string {
	const cleaned = title

		.replace(/[\u0000-\u001f<>:"/\\|?*]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/^[. ]+/, "")
		.slice(0, 80)
		.replace(/[. ]+$/, "")
		.trim();

	return cleaned === "" ? "snippet" : cleaned;
}

/**
 * Builds unique file names for a batch, ignoring case.
 * Duplicates get a numeric suffix before the extension.
 */
export function makeUniqueFileNames(
	entries: { base: string; extension: string }[],
): string[] {
	const used = new Set<string>();

	return entries.map(({ base, extension }) => {
		const withExtension = (name: string) =>
			extension === "" ? name : `${name}.${extension}`;

		let candidate = withExtension(base);
		let counter = 2;

		while (used.has(candidate.toLowerCase())) {
			candidate = withExtension(`${base}-${counter}`);
			counter += 1;
		}

		used.add(candidate.toLowerCase());
		return candidate;
	});
}

export type CodeExportFile = {
	fileName: string;
	code: string;
};

/**
 * Plans the source files of a code-only export: one file per snippet named
 * after its title, with the extension of its language.
 */
export function buildCodeExportFiles(snippets: Snippet[]): CodeExportFile[] {
	const names = makeUniqueFileNames(
		snippets.map((snippet) => ({
			base: sanitizeFileName(snippet.title),
			extension: getFileExtensionForLanguage(snippet.language),
		})),
	);

	return snippets.map((snippet, index) => ({
		fileName: names[index],
		code: snippet.code,
	}));
}

/** Packs source files into a flat ZIP archive without extra directories. */
export function buildCodeExportArchive(files: CodeExportFile[]): Uint8Array {
	const entries: Record<string, Uint8Array> = {};

	for (const file of files) {
		entries[file.fileName] = strToU8(file.code);
	}

	return zipSync(entries);
}
