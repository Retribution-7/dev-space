import { describe, expect, it } from "bun:test";

import { compareJson } from "./compare-json";

describe("compareJson", () => {
	it("reports no differences for identical documents", () => {
		const document = `{
			"user": { "name": "Ada", "roles": ["admin", "editor"] },
			"active": true,
			"score": 42,
			"note": null
		}`;

		expect(compareJson(document, document)).toEqual({
			status: "success",
			differences: [],
		});
	});

	it("ignores object key order", () => {
		expect(
			compareJson(
				'{"name":"DevSpace","meta":{"active":true,"version":1},"items":[1,2]}',
				'{"items":[1,2],"meta":{"version":1,"active":true},"name":"DevSpace"}',
			),
		).toEqual({ status: "success", differences: [] });
	});

	it("reports a removed object property", () => {
		expect(
			compareJson('{"name":"DevSpace","legacy":true}', '{"name":"DevSpace"}'),
		).toEqual({
			status: "success",
			differences: [{ type: "removed", path: "$.legacy", oldValue: true }],
		});
	});

	it("reports an added object property", () => {
		expect(
			compareJson('{"name":"DevSpace"}', '{"name":"DevSpace","stars":5}'),
		).toEqual({
			status: "success",
			differences: [{ type: "added", path: "$.stars", newValue: 5 }],
		});
	});

	it("reports a changed object property", () => {
		expect(compareJson('{"name":"DevSpace"}', '{"name":"DevSpace 2"}')).toEqual(
			{
				status: "success",
				differences: [
					{
						type: "changed",
						path: "$.name",
						oldValue: "DevSpace",
						newValue: "DevSpace 2",
					},
				],
			},
		);
	});

	it("builds a dotted path for nested object properties", () => {
		expect(
			compareJson(
				'{"user":{"name":"Ada","age":36}}',
				'{"user":{"name":"Grace","age":36}}',
			),
		).toEqual({
			status: "success",
			differences: [
				{
					type: "changed",
					path: "$.user.name",
					oldValue: "Ada",
					newValue: "Grace",
				},
			],
		});
	});

	it("uses bracket notation for keys that are not identifiers", () => {
		expect(
			compareJson(
				'{"ключ с пробелом":1,"simple":1}',
				'{"ключ с пробелом":2,"simple":1}',
			),
		).toEqual({
			status: "success",
			differences: [
				{
					type: "changed",
					path: '$["ключ с пробелом"]',
					oldValue: 1,
					newValue: 2,
				},
			],
		});
	});

	it("uses the root path for a changed document value", () => {
		expect(compareJson("1", "2")).toEqual({
			status: "success",
			differences: [{ type: "changed", path: "$", oldValue: 1, newValue: 2 }],
		});
	});

	it("reports an added array element", () => {
		expect(compareJson('{"items":[1,2]}', '{"items":[1,2,3]}')).toEqual({
			status: "success",
			differences: [{ type: "added", path: "$.items[2]", newValue: 3 }],
		});
	});

	it("reports a removed array element", () => {
		expect(compareJson('{"items":[1,2,3]}', '{"items":[1,2]}')).toEqual({
			status: "success",
			differences: [{ type: "removed", path: "$.items[2]", oldValue: 3 }],
		});
	});

	it("reports a changed array element at its index", () => {
		expect(compareJson('{"items":["a","b"]}', '{"items":["c","b"]}')).toEqual({
			status: "success",
			differences: [
				{
					type: "changed",
					path: "$.items[0]",
					oldValue: "a",
					newValue: "c",
				},
			],
		});
	});

	it("compares reordered arrays by index instead of detecting moves", () => {
		expect(compareJson("[1,2,3]", "[3,1,2]")).toEqual({
			status: "success",
			differences: [
				{ type: "changed", path: "$[0]", oldValue: 1, newValue: 3 },
				{ type: "changed", path: "$[1]", oldValue: 2, newValue: 1 },
				{ type: "changed", path: "$[2]", oldValue: 3, newValue: 2 },
			],
		});
	});

	it("builds paths through nested arrays and objects", () => {
		const original = `{
			"teams": [
				{
					"name": "Core",
					"members": [
						{ "name": "Ada", "skills": ["ts", "go"] },
						{ "name": "Grace", "skills": ["rust"] }
					]
				}
			]
		}`;
		const modified = `{
			"teams": [
				{
					"name": "Core",
					"members": [
						{ "name": "Ada", "skills": ["ts", "go"] },
						{ "name": "Linus", "skills": ["rust"] }
					]
				}
			]
		}`;

		expect(compareJson(original, modified)).toEqual({
			status: "success",
			differences: [
				{
					type: "changed",
					path: "$.teams[0].members[1].name",
					oldValue: "Grace",
					newValue: "Linus",
				},
			],
		});
	});

	it("reports a changed value when an object becomes an array", () => {
		expect(compareJson('{"data":{"a":1}}', '{"data":[1]}')).toEqual({
			status: "success",
			differences: [
				{
					type: "changed",
					path: "$.data",
					oldValue: { a: 1 },
					newValue: [1],
				},
			],
		});
	});

	it("reports a changed value when a string becomes a number", () => {
		expect(compareJson('{"count":"1"}', '{"count":1}')).toEqual({
			status: "success",
			differences: [
				{ type: "changed", path: "$.count", oldValue: "1", newValue: 1 },
			],
		});
	});

	it("distinguishes null, false, 0, and empty strings", () => {
		expect(
			compareJson(
				'{"nullValue":null,"falseValue":false,"zeroValue":0,"emptyValue":""}',
				'{"nullValue":false,"falseValue":0,"zeroValue":"","emptyValue":null}',
			),
		).toEqual({
			status: "success",
			differences: [
				{
					type: "changed",
					path: "$.nullValue",
					oldValue: null,
					newValue: false,
				},
				{
					type: "changed",
					path: "$.falseValue",
					oldValue: false,
					newValue: 0,
				},
				{
					type: "changed",
					path: "$.zeroValue",
					oldValue: 0,
					newValue: "",
				},
				{
					type: "changed",
					path: "$.emptyValue",
					oldValue: "",
					newValue: null,
				},
			],
		});
	});

	it("reports an empty Original document", () => {
		expect(compareJson("", '{"a":1}')).toEqual({
			status: "error",
			issues: [{ document: "original", reason: "empty" }],
		});
	});

	it("reports an empty Modified document", () => {
		expect(compareJson('{"a":1}', "   ")).toEqual({
			status: "error",
			issues: [{ document: "modified", reason: "empty" }],
		});
	});

	it("reports both documents when both are empty", () => {
		expect(compareJson("", "")).toEqual({
			status: "error",
			issues: [
				{ document: "original", reason: "empty" },
				{ document: "modified", reason: "empty" },
			],
		});
	});

	it("reports an invalid Original document", () => {
		expect(compareJson('{"a":}', '{"a":1}')).toEqual({
			status: "error",
			issues: [
				{
					document: "original",
					reason: "invalid",
					message: expect.any(String),
				},
			],
		});
	});

	it("reports an invalid Modified document", () => {
		expect(compareJson('{"a":1}', '{"a":}')).toEqual({
			status: "error",
			issues: [
				{
					document: "modified",
					reason: "invalid",
					message: expect.any(String),
				},
			],
		});
	});

	it("reports invalid issues for both documents in order", () => {
		expect(compareJson('{"a":}', "]")).toEqual({
			status: "error",
			issues: [
				{
					document: "original",
					reason: "invalid",
					message: expect.any(String),
				},
				{
					document: "modified",
					reason: "invalid",
					message: expect.any(String),
				},
			],
		});
	});
});
