import { describe, expect, it } from "bun:test";
import { strToU8, zipSync } from "fflate";

import {
	buildSnippetFromSourceFile,
	createRandomId,
	createSourceFileCandidate,
	extractSourceFilesFromArchive,
	findSnippetsIdConflicts,
	MAX_SOURCE_FILE_BYTES,
	parseSnippetsImportDocument,
	resolveImportConflicts,
} from "./snippet-import";
import type { Snippet } from "./types";

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
	return {
		id: "snippet-1",
		title: "Debounce hook",
		description: "Delays updates.",
		code: "const value = useDebounce(input, 300);",
		language: "TypeScript",
		category: "Utilities",
		tags: ["react", "hooks"],
		isFavorite: true,
		createdAt: "2026-01-01T09:00:00.000Z",
		updatedAt: "2026-01-02T09:00:00.000Z",
		...overrides,
	};
}

function makeDocument(entries: unknown[]): string {
	return JSON.stringify({
		format: "devspace-snippets",
		version: 1,
		exportedAt: "2026-01-15T10:00:00.000Z",
		snippets: entries,
	});
}

describe("parseSnippetsImportDocument", () => {
	it("imports a valid document", () => {
		const snippet = makeSnippet();
		const result = parseSnippetsImportDocument(makeDocument([snippet]));

		expect(result).toEqual({
			ok: true,
			result: { snippets: [snippet], errors: [] },
		});
	});

	it("rejects invalid JSON", () => {
		expect(parseSnippetsImportDocument("{not json")).toEqual({
			ok: false,
			error: "The file does not contain valid JSON.",
		});
	});

	it("rejects documents with an unknown format", () => {
		expect(
			parseSnippetsImportDocument(
				JSON.stringify({ format: "other", version: 1, snippets: [] }),
			),
		).toEqual({
			ok: false,
			error: "The file is not a DevSpace snippets document.",
		});
	});

	it("rejects unsupported versions", () => {
		expect(
			parseSnippetsImportDocument(
				JSON.stringify({
					format: "devspace-snippets",
					version: 2,
					snippets: [],
				}),
			),
		).toEqual({
			ok: false,
			error: "Unsupported document version. Only version 1 is supported.",
		});
	});

	it("rejects documents without a snippets array", () => {
		expect(
			parseSnippetsImportDocument(
				JSON.stringify({ format: "devspace-snippets", version: 1 }),
			),
		).toEqual({
			ok: false,
			error: "The document does not contain a snippets array.",
		});
	});

	it("reports invalid entries with their position and keeps valid ones", () => {
		const result = parseSnippetsImportDocument(
			makeDocument([
				makeSnippet({ id: "valid-1" }),
				{ ...makeSnippet({ id: "broken" }), title: "   " },
				makeSnippet({ id: "valid-2" }),
				"not an object",
			]),
		);

		if (!result.ok) {
			throw new Error("Expected a successful parse.");
		}

		expect(result.result.snippets.map((snippet) => snippet.id)).toEqual([
			"valid-1",
			"valid-2",
		]);
		expect(result.result.errors).toEqual([
			{ index: 2, message: "title is required." },
			{ index: 4, message: "The entry is not an object." },
		]);
	});

	it("validates field types", () => {
		const result = parseSnippetsImportDocument(
			makeDocument([
				{ ...makeSnippet({ id: "a" }), language: "Rust" },
				{ ...makeSnippet({ id: "b" }), category: "Legacy" },
				{ ...makeSnippet({ id: "c" }), tags: "react" },
				{ ...makeSnippet({ id: "d" }), tags: [1, 2] },
				{ ...makeSnippet({ id: "e" }), isFavorite: "yes" },
				{ ...makeSnippet({ id: "f" }), createdAt: "not-a-date" },
				{ ...makeSnippet({ id: "g" }), code: "" },
			]),
		);

		if (!result.ok) {
			throw new Error("Expected a successful parse.");
		}

		expect(result.result.snippets).toEqual([]);
		expect(result.result.errors.map((error) => error.message)).toEqual([
			'Unsupported language "Rust".',
			'Unsupported category "Legacy".',
			"tags must be an array.",
			"tags must contain only strings.",
			"isFavorite must be a boolean.",
			"createdAt is not a valid date.",
			"code is required.",
		]);
	});

	it("rejects duplicated ids inside the document", () => {
		const result = parseSnippetsImportDocument(
			makeDocument([
				makeSnippet({ id: "same" }),
				makeSnippet({ id: "same", title: "Another" }),
			]),
		);

		if (!result.ok) {
			throw new Error("Expected a successful parse.");
		}

		expect(result.result.snippets).toHaveLength(1);
		expect(result.result.errors).toEqual([
			{ index: 2, message: 'Duplicate id "same".' },
		]);
	});

	it("normalizes missing optional fields", () => {
		const result = parseSnippetsImportDocument(
			makeDocument([
				{
					id: "minimal",
					title: "Minimal",
					code: "code",
					language: "typescript",
					createdAt: "2026-01-01T09:00:00.000Z",
					updatedAt: "2026-01-02T09:00:00.000Z",
				},
			]),
		);

		if (!result.ok) {
			throw new Error("Expected a successful parse.");
		}

		expect(result.result.snippets[0]).toEqual({
			id: "minimal",
			title: "Minimal",
			description: "",
			code: "code",
			language: "TypeScript",
			category: "General",
			tags: [],
			isFavorite: false,
			createdAt: "2026-01-01T09:00:00.000Z",
			updatedAt: "2026-01-02T09:00:00.000Z",
		});
	});
});

describe("id conflicts", () => {
	const imported = [makeSnippet({ id: "a" }), makeSnippet({ id: "b" })];
	const existing = [makeSnippet({ id: "b" }), makeSnippet({ id: "c" })];

	it("detects conflicting ids", () => {
		expect(findSnippetsIdConflicts(imported, existing)).toEqual(["b"]);
	});

	it("skips duplicates when requested", () => {
		const records = resolveImportConflicts(imported, existing, "skip");

		expect(records.map((snippet) => snippet.id)).toEqual(["a"]);
	});

	it("imports duplicates as copies with new ids", () => {
		const ids = ["copy-1", "copy-2"];
		const records = resolveImportConflicts(
			imported,
			existing,
			"copies",
			() => ids.shift() ?? createRandomId(),
		);

		expect(records.map((snippet) => snippet.id)).toEqual(["a", "copy-1"]);
		expect(records[1]).toEqual({ ...makeSnippet({ id: "copy-1" }) });
	});

	it("keeps the original dates for copies", () => {
		const records = resolveImportConflicts(
			[makeSnippet({ id: "b" })],
			existing,
			"copies",
			() => "copy-id",
		);

		expect(records[0].createdAt).toBe("2026-01-01T09:00:00.000Z");
		expect(records[0].updatedAt).toBe("2026-01-02T09:00:00.000Z");
	});

	it("does not mutate the imported records", () => {
		const records = resolveImportConflicts(
			imported,
			existing,
			"copies",
			() => "copy-id",
		);

		expect(imported.map((snippet) => snippet.id)).toEqual(["a", "b"]);
		expect(records).not.toBe(imported);
	});
});

describe("source file import", () => {
	it("detects the language by file extension", () => {
		expect(createSourceFileCandidate("main.ts", "code", 4).language).toBe(
			"TypeScript",
		);
		expect(createSourceFileCandidate("main.py", "code", 4).language).toBe(
			"Python",
		);
		expect(createSourceFileCandidate("data.json", "{}", 2).language).toBe(
			"JSON",
		);
		expect(createSourceFileCandidate("notes.txt", "text", 4).language).toBe(
			"Text",
		);
	});

	it("does not guess the language for unknown extensions", () => {
		const candidate = createSourceFileCandidate("main.unknown", "code", 4);

		expect(candidate.language).toBeNull();
		expect(candidate.error).toBeNull();
	});

	it("creates a snippet from a source file with default metadata", () => {
		const result = buildSnippetFromSourceFile(
			createSourceFileCandidate("debounce-hook.ts", "const value = 1;", 17),
			null,
			{
				generateId: () => "generated-id",
				timestamp: "2026-02-01T09:00:00.000Z",
			},
		);

		if ("error" in result) {
			throw new Error(result.error);
		}

		expect(result.snippet).toEqual({
			id: "generated-id",
			title: "debounce-hook",
			description: "",
			code: "const value = 1;",
			language: "TypeScript",
			category: "General",
			tags: [],
			isFavorite: false,
			createdAt: "2026-02-01T09:00:00.000Z",
			updatedAt: "2026-02-01T09:00:00.000Z",
		});
	});

	it("accepts a manually chosen language", () => {
		const result = buildSnippetFromSourceFile(
			createSourceFileCandidate("snippet.custom", "code", 4),
			"Python",
			{
				generateId: () => "generated-id",
				timestamp: "2026-02-01T09:00:00.000Z",
			},
		);

		if ("error" in result) {
			throw new Error(result.error);
		}

		expect(result.snippet.language).toBe("Python");
	});

	it("reports a missing language instead of guessing", () => {
		const result = buildSnippetFromSourceFile(
			createSourceFileCandidate("snippet.custom", "code", 4),
		);

		expect(result).toEqual({
			error: "The language is not defined for this file. Choose a language.",
		});
	});

	it("rejects empty files and oversized files", () => {
		expect(createSourceFileCandidate("empty.ts", "   ", 3).error).toBe(
			"The file is empty.",
		);
		expect(
			createSourceFileCandidate("big.ts", "x", MAX_SOURCE_FILE_BYTES + 1).error,
		).toContain("KB");
	});

	it("rejects binary and executable files", () => {
		expect(
			createSourceFileCandidate("image.ts", "png\u0000data", 9).error,
		).toBe("Binary files are not supported.");
		expect(createSourceFileCandidate("run.exe", "code", 4).error).toBe(
			"Executable files are not supported.",
		);
	});

	it("imports several files and keeps valid ones when others fail", () => {
		const candidates = [
			createSourceFileCandidate("first.ts", "first();", 8),
			createSourceFileCandidate("empty.ts", "", 0),
			createSourceFileCandidate("second.py", "second()", 8),
		];
		const records = candidates
			.map((candidate) => buildSnippetFromSourceFile(candidate))
			.flatMap((result) => ("snippet" in result ? [result.snippet] : []));

		expect(records.map((snippet) => snippet.title)).toEqual([
			"first",
			"second",
		]);
	});
});

describe("ZIP archives", () => {
	it("extracts text files and detects their languages", () => {
		const archive = zipSync({
			"src/main.ts": strToU8("main();"),
			"utils.py": strToU8("pass"),
		});
		const result = extractSourceFilesFromArchive(archive);

		if (!result.ok) {
			throw new Error(result.error);
		}

		expect(
			result.candidates.map((candidate) => [
				candidate.name,
				candidate.language,
			]),
		).toEqual([
			["main.ts", "TypeScript"],
			["utils.py", "Python"],
		]);
	});

	it("ignores directories and junk entries", () => {
		const archive = zipSync({
			"folder/": strToU8(""),
			"__MACOSX/._main.ts": strToU8("junk"),
			".DS_Store": strToU8("junk"),
			"main.ts": strToU8("main();"),
		});
		const result = extractSourceFilesFromArchive(archive);

		if (!result.ok) {
			throw new Error(result.error);
		}

		expect(result.candidates.map((candidate) => candidate.name)).toEqual([
			"main.ts",
		]);
	});

	it("protects against unsafe archive paths", () => {
		const archive = zipSync({
			"../evil.ts": strToU8("evil();"),
			"/abs.ts": strToU8("abs();"),
			"main.ts": strToU8("main();"),
		});
		const result = extractSourceFilesFromArchive(archive);

		if (!result.ok) {
			throw new Error(result.error);
		}

		expect(result.candidates.map((candidate) => candidate.name)).toEqual([
			"main.ts",
		]);
		expect(result.skipped).toEqual([
			{ name: "../evil.ts", message: "Unsafe file path." },
			{ name: "/abs.ts", message: "Unsafe file path." },
		]);
	});

	it("rejects corrupt archives", () => {
		expect(
			extractSourceFilesFromArchive(strToU8("this is not a zip file")),
		).toEqual({ ok: false, error: "The archive could not be read." });
	});

	it("keeps valid files when other entries are invalid", () => {
		const archive = zipSync({
			"good.ts": strToU8("good();"),
			"empty.ts": strToU8(""),
			"binary.ts": strToU8("bin\u0000ary"),
			"tool.exe": strToU8("mz"),
		});
		const result = extractSourceFilesFromArchive(archive);

		if (!result.ok) {
			throw new Error(result.error);
		}

		const byName = new Map(
			result.candidates.map((candidate) => [candidate.name, candidate]),
		);

		expect(byName.get("good.ts")?.error).toBeNull();
		expect(byName.get("empty.ts")?.error).toBe("The file is empty.");
		expect(byName.get("binary.ts")?.error).toBe(
			"Binary files are not supported.",
		);
		expect(byName.get("tool.exe")?.error).toBe(
			"Executable files are not supported.",
		);
	});
});
