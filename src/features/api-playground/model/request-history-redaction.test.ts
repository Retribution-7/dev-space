import { describe, expect, it } from "bun:test";

import type { RequestHistoryEntry } from "./request-history";
import {
	redactHistoryBody,
	redactHistoryRows,
	redactHistoryUrl,
	redactSensitiveText,
	sanitizeHistoryEntryForPersistence,
} from "./request-history-redaction";

describe("redactSensitiveText", () => {
	it("masks bearer tokens and JWTs", () => {
		const text =
			"Authorization: Bearer abcdefghijklmnop and jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";

		const redacted = redactSensitiveText(text);

		expect(redacted).toContain("Bearer [redacted]");
		expect(redacted).not.toContain("abcdefghijklmnop");
		expect(redacted).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
	});

	it("masks key-value secrets in query strings and form bodies", () => {
		expect(
			redactSensitiveText("password=hunter2&token=abc123&name=DevSpace"),
		).toBe("password=[redacted]&token=[redacted]&name=DevSpace");
	});
});

describe("redactHistoryRows", () => {
	it("masks sensitive header and parameter values", () => {
		const rows = redactHistoryRows([
			{ id: "1", key: "Authorization", value: "Bearer secret-token" },
			{ id: "2", key: "X-Api-Key", value: "api-secret" },
			{ id: "3", key: "Accept", value: "application/json" },
		]);

		expect(rows).toEqual([
			{ id: "1", key: "Authorization", value: "[redacted]" },
			{ id: "2", key: "X-Api-Key", value: "[redacted]" },
			{ id: "3", key: "Accept", value: "application/json" },
		]);
	});
});

describe("redactHistoryUrl", () => {
	it("masks sensitive query parameters", () => {
		const redacted = redactHistoryUrl(
			"https://api.example.com/users?api_key=secret&page=2&token=abc",
		);

		expect(redacted).toContain("api_key=%5Bredacted%5D");
		expect(redacted).toContain("token=%5Bredacted%5D");
		expect(redacted).toContain("page=2");
		expect(redacted).not.toContain("secret");
		expect(redacted).not.toContain("abc");
	});
});

describe("redactHistoryBody", () => {
	it("masks sensitive JSON fields and preserves nested structure", () => {
		expect(
			redactHistoryBody(
				'{"username":"dev","password":"hunter2","profile":{"token":"abc"}}',
				"json",
			),
		).toBe(
			'{"username":"dev","password":"[redacted]","profile":{"token":"[redacted]"}}',
		);
	});

	it("keeps non-sensitive JSON bodies unchanged", () => {
		const body = '{\n  "name": "DevSpace"\n}';

		expect(redactHistoryBody(body, "json")).toBe(body);
	});

	it("masks secrets in text bodies", () => {
		expect(redactHistoryBody("password=hunter2", "text")).toBe(
			"password=[redacted]",
		);
	});
});

describe("sanitizeHistoryEntryForPersistence", () => {
	it("redacts sensitive request data before it is saved", () => {
		const entry: RequestHistoryEntry = {
			id: "entry-1",
			executedAt: "2026-11-16T10:00:00.000Z",
			draft: {
				method: "POST",
				url: "https://api.example.com/users?api_key=secret",
				params: [{ id: "1", key: "token", value: "param-secret" }],
				headers: [{ id: "2", key: "Authorization", value: "Bearer secret" }],
				bodyType: "json",
				body: '{"password":"hunter2"}',
			},
			result: {
				outcome: "network-error",
				durationMs: 10,
				message: "token=abc123",
			},
		};

		const sanitized = sanitizeHistoryEntryForPersistence(entry);

		expect(sanitized.draft.url).not.toContain("secret");
		expect(sanitized.draft.params[0].value).toBe("[redacted]");
		expect(sanitized.draft.headers[0].value).toBe("[redacted]");
		expect(sanitized.draft.body).toContain('"password":"[redacted]"');
		expect(sanitized.result.message).toBe("token=[redacted]");

		// The original in-memory entry keeps its raw values.
		expect(entry.draft.headers[0].value).toBe("Bearer secret");
	});
});
