import { describe, expect, it } from "bun:test";

import { parseJson } from "./parse-json";

describe("parseJson", () => {
	it("parses an object", () => {
		expect(parseJson('{"name":"DevSpace","stars":5}')).toEqual({
			status: "success",
			value: { name: "DevSpace", stars: 5 },
		});
	});

	it("parses an array", () => {
		expect(parseJson('[1,"two",true,null]')).toEqual({
			status: "success",
			value: [1, "two", true, null],
		});
	});

	it("parses a string", () => {
		expect(parseJson('"DevSpace"')).toEqual({
			status: "success",
			value: "DevSpace",
		});
	});

	it("parses a number", () => {
		expect(parseJson("-1.5e2")).toEqual({
			status: "success",
			value: -150,
		});
	});

	it("parses a boolean", () => {
		expect(parseJson("true")).toEqual({ status: "success", value: true });
		expect(parseJson("false")).toEqual({ status: "success", value: false });
	});

	it("parses null", () => {
		expect(parseJson("null")).toEqual({ status: "success", value: null });
	});

	it("parses nested objects and arrays", () => {
		expect(
			parseJson('{"user":{"roles":["admin",{"scope":"all"}],"active":true}}'),
		).toEqual({
			status: "success",
			value: {
				user: {
					roles: ["admin", { scope: "all" }],
					active: true,
				},
			},
		});
	});

	it("returns empty for empty or whitespace-only input", () => {
		expect(parseJson("")).toEqual({ status: "empty" });
		expect(parseJson(" \n\t ")).toEqual({ status: "empty" });
	});

	it("returns invalid with a message for malformed JSON", () => {
		const result = parseJson('{"name": }');

		if (result.status !== "invalid") {
			throw new Error("Expected malformed JSON to be rejected.");
		}

		expect(result.message.length).toBeGreaterThan(0);
	});
});
