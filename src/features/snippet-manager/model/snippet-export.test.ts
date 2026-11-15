import { describe, expect, it } from "bun:test";
import { strFromU8, unzipSync } from "fflate";

import {
	buildCodeExportArchive,
	buildCodeExportFiles,
	buildSnippetsExportDocument,
	buildSnippetsExportFileName,
	makeUniqueFileNames,
	sanitizeFileName,
	serializeSnippetsExportDocument,
	SNIPPETS_EXPORT_FORMAT,
	SNIPPETS_EXPORT_VERSION,
} from "./snippet-export";
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

const EXPORT_DATE = new Date("2026-01-15T10:00:00.000Z");

describe("buildSnippetsExportDocument", () => {
	it("builds a versioned document with all snippet fields", () => {
		const snippet = makeSnippet();
		const document = buildSnippetsExportDocument([snippet], EXPORT_DATE);

		expect(document).toEqual({
			format: SNIPPETS_EXPORT_FORMAT,
			version: SNIPPETS_EXPORT_VERSION,
			exportedAt: "2026-01-15T10:00:00.000Z",
			snippets: [snippet],
		});
		expect(document.format).toBe("devspace-snippets");
		expect(document.version).toBe(1);
	});

	it("exports every saved snippet", () => {
		const snippets = [
			makeSnippet({ id: "snippet-1" }),
			makeSnippet({ id: "snippet-2", title: "Second" }),
			makeSnippet({ id: "snippet-3", title: "Third" }),
		];

		const document = buildSnippetsExportDocument(snippets, EXPORT_DATE);

		expect(document.snippets.map((snippet) => snippet.id)).toEqual([
			"snippet-1",
			"snippet-2",
			"snippet-3",
		]);
	});

	it("does not mutate the source collection", () => {
		const snippet = makeSnippet();
		const snippets = [snippet];
		const original = { ...snippet, tags: [...snippet.tags] };

		const document = buildSnippetsExportDocument(snippets, EXPORT_DATE);
		document.snippets[0].tags.push("mutated");

		expect(snippet).toEqual(original);
		expect(snippets).toEqual([original]);
	});

	it("serializes the document with indentation", () => {
		const text = serializeSnippetsExportDocument(
			buildSnippetsExportDocument([makeSnippet()], EXPORT_DATE),
		);

		expect(text).toContain("\n  ");
		expect(JSON.parse(text).snippets).toHaveLength(1);
	});

	it("names the file after the export date", () => {
		expect(buildSnippetsExportFileName(EXPORT_DATE)).toBe(
			"devspace-snippets-2026-01-15.json",
		);
	});
});

describe("code-only export", () => {
	it("uses the file extension of each language", () => {
		const files = buildCodeExportFiles([
			makeSnippet({ id: "a", title: "A", language: "TypeScript", code: "ts" }),
			makeSnippet({ id: "b", title: "B", language: "JavaScript", code: "js" }),
			makeSnippet({ id: "c", title: "C", language: "JSON", code: "{}" }),
			makeSnippet({ id: "d", title: "D", language: "HTML", code: "<p>" }),
			makeSnippet({ id: "e", title: "E", language: "CSS", code: "p{}" }),
			makeSnippet({ id: "f", title: "F", language: "Python", code: "pass" }),
			makeSnippet({ id: "g", title: "G", language: "SQL", code: "select 1" }),
			makeSnippet({ id: "h", title: "H", language: "Text", code: "plain" }),
		]);

		expect(files.map((file) => file.fileName)).toEqual([
			"A.ts",
			"B.js",
			"C.json",
			"D.html",
			"E.css",
			"F.py",
			"G.sql",
			"H.txt",
		]);
	});

	it("falls back to a text extension for unknown languages", () => {
		const files = buildCodeExportFiles([
			makeSnippet({ title: "Rust code", language: "Rust" }),
		]);

		expect(files[0].fileName).toBe("Rust code.txt");
	});

	it("builds file names from sanitized snippet titles", () => {
		expect(sanitizeFileName("  My / Snippet: <test>?  ")).toBe(
			"My Snippet test",
		);
		expect(sanitizeFileName("...")).toBe("snippet");
		expect(sanitizeFileName("")).toBe("snippet");
		expect(sanitizeFileName("a".repeat(200)).length).toBeLessThanOrEqual(80);
	});

	it("makes colliding names unique", () => {
		const files = buildCodeExportFiles([
			makeSnippet({ id: "a", title: "utils", language: "Python", code: "1" }),
			makeSnippet({ id: "b", title: "utils", language: "Python", code: "2" }),
			makeSnippet({ id: "c", title: "utils-2", language: "Python", code: "3" }),
			makeSnippet({ id: "d", title: "Utils", language: "Python", code: "4" }),
		]);

		expect(files.map((file) => file.fileName)).toEqual([
			"utils.py",
			"utils-2.py",
			"utils-2-2.py",
			"Utils-3.py",
		]);
		expect(new Set(files.map((file) => file.fileName.toLowerCase())).size).toBe(
			4,
		);
	});

	it("keeps same-titled snippets with different languages apart", () => {
		const names = makeUniqueFileNames([
			{ base: "utils", extension: "py" },
			{ base: "utils", extension: "ts" },
		]);

		expect(names).toEqual(["utils.py", "utils.ts"]);
	});

	it("packs multiple files into a flat archive without metadata", () => {
		const files = buildCodeExportFiles([
			makeSnippet({ id: "a", title: "Alpha", code: "alpha();" }),
			makeSnippet({
				id: "b",
				title: "Beta",
				language: "Python",
				code: "beta()",
			}),
		]);
		const entries = unzipSync(buildCodeExportArchive(files));

		expect(Object.keys(entries).sort()).toEqual(["Alpha.ts", "Beta.py"]);
		expect(strFromU8(entries["Alpha.ts"])).toBe("alpha();");
		expect(strFromU8(entries["Beta.py"])).toBe("beta()");
		expect(Object.keys(entries).some((name) => name.endsWith(".json"))).toBe(
			false,
		);
		expect(Object.keys(entries).some((name) => name.includes("/"))).toBe(false);
	});
});
