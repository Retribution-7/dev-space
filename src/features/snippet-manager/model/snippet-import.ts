import { strFromU8, unzipSync } from "fflate";

import {
	DEFAULT_SNIPPET_CATEGORY,
	findSnippetCategory,
} from "./snippet-categories";
import { normalizeTags } from "./snippet-draft";
import {
	SNIPPETS_EXPORT_FORMAT,
	SNIPPETS_EXPORT_VERSION,
} from "./snippet-export";
import {
	getFileExtensionFromFileName,
	getFileNameWithoutExtension,
	getLanguageForFileExtension,
	getPathBaseName,
	normalizeSnippetLanguage,
} from "./snippet-languages";
import { createSnippet } from "./snippet-operations";
import { validateSnippetDraft } from "./snippet-validation";
import type { Snippet, SnippetDraft } from "./types";

export const MAX_SOURCE_FILE_BYTES = 1024 * 1024;
export const MAX_ARCHIVE_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_FILES = 100;

const EXECUTABLE_EXTENSIONS = new Set([
	"exe",
	"dll",
	"bat",
	"cmd",
	"com",
	"msi",
	"scr",
	"sh",
	"bash",
	"zsh",
	"app",
	"so",
	"dylib",
	"bin",
	"jar",
	"ps1",
	"vbs",
]);

export function createRandomId(): string {
	return crypto.randomUUID();
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/* -------------------------------------------------------------------------- */
/* Importing a JSON document with metadata                                     */
/* -------------------------------------------------------------------------- */

export type SnippetsImportEntryError = {
	/** 1-based position of the entry in the document. */
	index: number;
	message: string;
};

export type SnippetsImportResult = {
	snippets: Snippet[];
	errors: SnippetsImportEntryError[];
};

export type SnippetsImportDocumentResult =
	{ ok: true; result: SnippetsImportResult } | { ok: false; error: string };

function readRequiredString(
	entry: Record<string, unknown>,
	field: string,
): { value: string } | { error: string } {
	const value = entry[field];

	if (typeof value !== "string") {
		return { error: `${field} must be a string.` };
	}

	if (value.trim() === "") {
		return { error: `${field} is required.` };
	}

	return { value: value.trim() };
}

function readDate(
	entry: Record<string, unknown>,
	field: string,
): { value: string } | { error: string } {
	const value = entry[field];

	if (typeof value !== "string" || value.trim() === "") {
		return { error: `${field} must be a date string.` };
	}

	if (Number.isNaN(new Date(value).getTime())) {
		return { error: `${field} is not a valid date.` };
	}

	return { value };
}

function parseImportedSnippet(
	entry: unknown,
	seenIds: Set<string>,
): { snippet: Snippet } | { error: string } {
	if (!isRecord(entry)) {
		return { error: "The entry is not an object." };
	}

	const id = readRequiredString(entry, "id");

	if ("error" in id) {
		return id;
	}

	if (seenIds.has(id.value)) {
		return { error: `Duplicate id "${id.value}".` };
	}

	const title = readRequiredString(entry, "title");

	if ("error" in title) {
		return title;
	}

	const code = readRequiredString(entry, "code");

	if ("error" in code) {
		return code;
	}

	const createdAt = readDate(entry, "createdAt");

	if ("error" in createdAt) {
		return createdAt;
	}

	const updatedAt = readDate(entry, "updatedAt");

	if ("error" in updatedAt) {
		return updatedAt;
	}

	if (entry.language === undefined) {
		return { error: "language is required." };
	}

	if (typeof entry.language !== "string") {
		return { error: "language must be a string." };
	}

	const language = normalizeSnippetLanguage(entry.language);

	if (language === null) {
		return { error: `Unsupported language "${entry.language}".` };
	}

	let category: Snippet["category"] = DEFAULT_SNIPPET_CATEGORY;

	if (entry.category !== undefined) {
		if (typeof entry.category !== "string") {
			return { error: "category must be a string." };
		}

		const knownCategory = findSnippetCategory(entry.category);

		if (knownCategory === null) {
			return { error: `Unsupported category "${entry.category}".` };
		}

		category = knownCategory;
	}

	let tags: string[] = [];

	if (entry.tags !== undefined) {
		if (!Array.isArray(entry.tags)) {
			return { error: "tags must be an array." };
		}

		if (!entry.tags.every((tag) => typeof tag === "string")) {
			return { error: "tags must contain only strings." };
		}

		tags = normalizeTags(entry.tags);
	}

	let isFavorite = false;

	if (entry.isFavorite !== undefined) {
		if (typeof entry.isFavorite !== "boolean") {
			return { error: "isFavorite must be a boolean." };
		}

		isFavorite = entry.isFavorite;
	}

	let description = "";

	if (entry.description !== undefined) {
		if (typeof entry.description !== "string") {
			return { error: "description must be a string." };
		}

		description = entry.description.trim();
	}

	return {
		snippet: {
			id: id.value,
			title: title.value,
			description,
			code: code.value,
			language,
			category,
			tags,
			isFavorite,
			createdAt: createdAt.value,
			updatedAt: updatedAt.value,
		},
	};
}

/**
 * Parses and validates a DevSpace snippets export document.
 * Broken documents are rejected as a whole; broken entries are reported with
 * their position and reason and are never imported silently.
 */
export function parseSnippetsImportDocument(
	text: string,
): SnippetsImportDocumentResult {
	let parsed: unknown;

	try {
		parsed = JSON.parse(text);
	} catch {
		return { ok: false, error: "The file does not contain valid JSON." };
	}

	if (!isRecord(parsed)) {
		return {
			ok: false,
			error: "The file is not a DevSpace snippets document.",
		};
	}

	if (parsed.format !== SNIPPETS_EXPORT_FORMAT) {
		return {
			ok: false,
			error: "The file is not a DevSpace snippets document.",
		};
	}

	if (parsed.version !== SNIPPETS_EXPORT_VERSION) {
		return {
			ok: false,
			error: `Unsupported document version. Only version ${SNIPPETS_EXPORT_VERSION} is supported.`,
		};
	}

	if (!Array.isArray(parsed.snippets)) {
		return {
			ok: false,
			error: "The document does not contain a snippets array.",
		};
	}

	const snippets: Snippet[] = [];
	const errors: SnippetsImportEntryError[] = [];
	const seenIds = new Set<string>();

	for (const [index, entry] of parsed.snippets.entries()) {
		const result = parseImportedSnippet(entry, seenIds);

		if ("error" in result) {
			errors.push({ index: index + 1, message: result.error });
		} else {
			seenIds.add(result.snippet.id);
			snippets.push(result.snippet);
		}
	}

	return { ok: true, result: { snippets, errors } };
}

/* -------------------------------------------------------------------------- */
/* Resolving id conflicts                                                      */
/* -------------------------------------------------------------------------- */

export type ImportConflictStrategy = "skip" | "copies";

/** Ids of imported snippets that already exist in the local collection. */
export function findSnippetsIdConflicts(
	imported: Snippet[],
	existing: Snippet[],
): string[] {
	const existingIds = new Set(existing.map((snippet) => snippet.id));

	return imported
		.filter((snippet) => existingIds.has(snippet.id))
		.map((snippet) => snippet.id);
}

/**
 * Applies the chosen conflict strategy.
 * Conflicting entries are either skipped or imported as copies with new ids,
 * keeping all other fields and the original dates.
 */
export function resolveImportConflicts(
	imported: Snippet[],
	existing: Snippet[],
	strategy: ImportConflictStrategy,
	generateId: () => string = createRandomId,
): Snippet[] {
	const existingIds = new Set(existing.map((snippet) => snippet.id));

	return imported
		.filter((snippet) => strategy === "copies" || !existingIds.has(snippet.id))
		.map((snippet) =>
			existingIds.has(snippet.id)
				? { ...snippet, id: generateId(), tags: [...snippet.tags] }
				: { ...snippet, tags: [...snippet.tags] },
		);
}

/* -------------------------------------------------------------------------- */
/* Importing source code files                                                 */
/* -------------------------------------------------------------------------- */

export type SourceFileCandidate = {
	name: string;
	content: string;
	size: number;
	language: string | null;
	error: string | null;
};

function isUnsafeArchivePath(path: string): boolean {
	const normalized = path.replace(/\\/g, "/");

	return (
		normalized.startsWith("/") ||
		normalized.split("/").includes("..") ||
		/^[a-zA-Z]:/.test(normalized) ||
		normalized.includes("\u0000")
	);
}

/**
 * Validates a source file and detects its language by extension.
 * The language is never guessed from the content.
 */
export function createSourceFileCandidate(
	name: string,
	content: string,
	size: number,
): SourceFileCandidate {
	const baseName = getPathBaseName(name);
	const extension = getFileExtensionFromFileName(baseName);
	const language = getLanguageForFileExtension(extension);

	let error: string | null = null;

	if (getFileNameWithoutExtension(baseName).trim() === "") {
		error = "The file name is empty.";
	} else if (EXECUTABLE_EXTENSIONS.has(extension)) {
		error = "Executable files are not supported.";
	} else if (size > MAX_SOURCE_FILE_BYTES) {
		error = `The file is larger than ${Math.round(MAX_SOURCE_FILE_BYTES / 1024)} KB.`;
	} else if (content.includes("\u0000")) {
		error = "Binary files are not supported.";
	} else if (content.trim() === "") {
		error = "The file is empty.";
	}

	return { name: baseName, content, size, language, error };
}

export type SourceFileImportResult = { snippet: Snippet } | { error: string };

/**
 * Creates a snippet from a validated source file.
 * A language can be provided manually when the extension is unknown.
 */
export function buildSnippetFromSourceFile(
	candidate: SourceFileCandidate,
	language: string | null = null,
	options: { generateId?: () => string; timestamp?: string } = {},
): SourceFileImportResult {
	if (candidate.error !== null) {
		return { error: candidate.error };
	}

	const resolvedLanguage = language ?? candidate.language;

	if (resolvedLanguage === null) {
		return {
			error: "The language is not defined for this file. Choose a language.",
		};
	}

	const draft: SnippetDraft = {
		title: getFileNameWithoutExtension(candidate.name),
		description: "",
		code: candidate.content,
		language: resolvedLanguage,
		category: DEFAULT_SNIPPET_CATEGORY,
		tags: [],
	};
	const errors = validateSnippetDraft(draft);

	if (errors.title) {
		return { error: errors.title };
	}

	if (errors.code) {
		return { error: errors.code };
	}

	return {
		snippet: createSnippet(draft, {
			id: (options.generateId ?? createRandomId)(),
			timestamp: options.timestamp ?? new Date().toISOString(),
		}),
	};
}

export type SourceArchiveResult =
	| {
			ok: true;
			candidates: SourceFileCandidate[];
			skipped: { name: string; message: string }[];
	  }
	| { ok: false; error: string };

/**
 * Extracts text source files from a ZIP archive.
 * Directories, junk files, unsafe paths, executables, and binary files are
 * never imported; the archive is only read, never executed.
 */
export function extractSourceFilesFromArchive(
	bytes: Uint8Array,
): SourceArchiveResult {
	if (bytes.length > MAX_ARCHIVE_BYTES) {
		return {
			ok: false,
			error: `The archive is larger than ${Math.round(MAX_ARCHIVE_BYTES / (1024 * 1024))} MB.`,
		};
	}

	let entries: Record<string, Uint8Array>;

	try {
		entries = unzipSync(bytes);
	} catch {
		return { ok: false, error: "The archive could not be read." };
	}

	const names = Object.keys(entries).filter(
		(name) => !name.endsWith("/") && !name.startsWith("__MACOSX/"),
	);

	if (names.length > MAX_IMPORT_FILES) {
		return {
			ok: false,
			error: `The archive contains more than ${MAX_IMPORT_FILES} files.`,
		};
	}

	const candidates: SourceFileCandidate[] = [];
	const skipped: { name: string; message: string }[] = [];

	for (const name of names) {
		const baseName = getPathBaseName(name);

		if (baseName === ".DS_Store") {
			continue;
		}

		if (isUnsafeArchivePath(name)) {
			skipped.push({ name, message: "Unsafe file path." });
			continue;
		}

		const entryBytes = entries[name];

		if (entryBytes.length > MAX_SOURCE_FILE_BYTES) {
			candidates.push({
				name: baseName,
				content: "",
				size: entryBytes.length,
				language: null,
				error: `The file is larger than ${Math.round(MAX_SOURCE_FILE_BYTES / 1024)} KB.`,
			});
			continue;
		}

		candidates.push(
			createSourceFileCandidate(
				baseName,
				strFromU8(entryBytes),
				entryBytes.length,
			),
		);
	}

	return { ok: true, candidates, skipped };
}
