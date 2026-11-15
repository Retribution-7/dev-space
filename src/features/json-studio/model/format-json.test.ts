import { describe, expect, it } from "bun:test";

import { formatJson } from "./format-json";

describe("formatJson", () => {
	it("formats a compact object with two-space indentation", () => {
		expect(
			formatJson('{"name":"DevSpace","version":"0.1.0","stars":5}'),
		).toEqual({
			status: "success",
			value: `{
  "name": "DevSpace",
  "version": "0.1.0",
  "stars": 5
}`,
		});
	});

	it("formats nested objects and arrays", () => {
		expect(
			formatJson(
				'{"user":{"name":"Ada","roles":["admin","editor"]},"active":true}',
			),
		).toEqual({
			status: "success",
			value: `{
  "user": {
    "name": "Ada",
    "roles": [
      "admin",
      "editor"
    ]
  },
  "active": true
}`,
		});
	});

	it("returns empty for empty input", () => {
		expect(formatJson("   ")).toEqual({ status: "empty" });
	});

	it("returns invalid without a transformed value for malformed JSON", () => {
		expect(formatJson('{"user": }')).toEqual({
			status: "invalid",
			message: expect.any(String),
		});
	});
});
