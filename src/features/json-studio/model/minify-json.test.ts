import { describe, expect, it } from "bun:test";

import { minifyJson } from "./minify-json";

describe("minifyJson", () => {
	it("removes insignificant whitespace", () => {
		const input = `{
			"name": "DevSpace",
			"features": ["json", "compare"],
			"meta": {
				"active": true,
				"count": 2,
				"note": null
			}
		}`;

		expect(minifyJson(input)).toEqual({
			status: "success",
			value:
				'{"name":"DevSpace","features":["json","compare"],"meta":{"active":true,"count":2,"note":null}}',
		});
	});

	it("preserves spaces and escapes inside string values", () => {
		expect(
			minifyJson('{ "message": "hello world", "escaped": "line\\nbreak" }'),
		).toEqual({
			status: "success",
			value: '{"message":"hello world","escaped":"line\\nbreak"}',
		});
	});

	it("returns empty for empty input", () => {
		expect(minifyJson("")).toEqual({ status: "empty" });
	});

	it("returns invalid without a transformed value for malformed JSON", () => {
		expect(minifyJson('{"features": [1, 2,]}')).toEqual({
			status: "invalid",
			message: expect.any(String),
		});
	});
});
