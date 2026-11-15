import { describe, expect, it } from "bun:test";

import { transformJson } from "./transform-json";

describe("transformJson", () => {
	it("passes the parsed value to the serializer and returns its output", () => {
		const received: unknown[] = [];
		const result = transformJson('{"items":[1,2,3]}', (value) => {
			received.push(value);
			return "serialized";
		});

		expect(received).toEqual([{ items: [1, 2, 3] }]);
		expect(result).toEqual({ status: "success", value: "serialized" });
	});

	it("returns invalid when the serializer cannot represent the value", () => {
		expect(transformJson('"value"', () => undefined)).toEqual({
			status: "invalid",
			message: "This value cannot be represented as JSON.",
		});
	});

	it("does not call the serializer for empty or invalid input", () => {
		let calls = 0;
		const serializer = () => {
			calls += 1;
			return "serialized";
		};

		expect(transformJson("", serializer)).toEqual({ status: "empty" });
		expect(transformJson("{", serializer)).toEqual({
			status: "invalid",
			message: expect.any(String),
		});
		expect(calls).toBe(0);
	});
});
