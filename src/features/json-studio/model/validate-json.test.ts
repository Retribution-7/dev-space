import { describe, expect, it } from "bun:test";

import { validateJson } from "./validate-json";

describe("validateJson", () => {
	it("accepts valid JSON", () => {
		expect(validateJson('{"name":"DevSpace","items":[1,2,3]}')).toEqual({
			status: "valid",
		});
	});

	it("returns empty for empty input", () => {
		expect(validateJson("")).toEqual({ status: "empty" });
	});

	it("rejects invalid JSON with a message", () => {
		const result = validateJson('{"name": "DevSpace"');

		if (result.status !== "invalid") {
			throw new Error("Expected invalid JSON to be rejected.");
		}

		expect(result.message.length).toBeGreaterThan(0);
	});
});
