import { describe, expect, it } from "bun:test";

import {
	addTag,
	findCanonicalTag,
	getTagSuggestions,
	RECOMMENDED_TAGS,
	removeTag,
	type TagSuggestion,
} from "./snippet-tags";

function suggestionTags(suggestions: TagSuggestion[]): string[] {
	return suggestions.map((suggestion) => suggestion.tag);
}

describe("recommended tag catalog", () => {
	it("groups recommended tags", () => {
		expect(RECOMMENDED_TAGS.map((group) => group.group)).toContain("Frontend");
		expect(
			RECOMMENDED_TAGS.find((group) => group.group === "Frontend")?.tags,
		).toContain("react");
	});

	it("finds the canonical spelling of recommended tags", () => {
		expect(findCanonicalTag("React")).toBe("react");
		expect(findCanonicalTag("  REACT  ")).toBe("react");
		expect(findCanonicalTag("my-custom-tag")).toBeNull();
	});
});

describe("getTagSuggestions", () => {
	it("suggests recommended tags by partial match", () => {
		expect(suggestionTags(getTagSuggestions("reac", []))).toContain("react");
	});

	it("matches suggestions without case sensitivity", () => {
		expect(suggestionTags(getTagSuggestions("REACT", []))).toContain("react");
	});

	it("excludes tags that are already added", () => {
		expect(
			suggestionTags(getTagSuggestions("react", ["React", "hooks"])),
		).not.toContain("react");
	});

	it("offers adding a custom tag when there is no exact catalog match", () => {
		const suggestions = getTagSuggestions("my-tag", []);

		expect(suggestions).toContainEqual({ type: "custom", tag: "my-tag" });
	});

	it("offers adding a custom tag next to partial matches", () => {
		const suggestions = getTagSuggestions("reac", []);

		expect(suggestionTags(suggestions)).toContain("react");
		expect(suggestions.at(-1)).toEqual({ type: "custom", tag: "reac" });
	});

	it("does not offer a custom tag when the input matches the catalog exactly", () => {
		const suggestions = getTagSuggestions("react", []);

		expect(
			suggestions.every((suggestion) => suggestion.type === "recommended"),
		).toBe(true);
	});

	it("does not offer a custom tag that duplicates an existing one", () => {
		expect(getTagSuggestions("MyTag", ["mytag"])).toEqual([]);
	});

	it("returns no suggestions for an empty input", () => {
		expect(getTagSuggestions("   ", [])).toEqual([]);
	});
});

describe("addTag", () => {
	it("adds a recommended tag using the canonical spelling", () => {
		expect(addTag([], "  React  ")).toEqual(["react"]);
	});

	it("adds a custom tag keeping the entered spelling", () => {
		expect(addTag([], " MyTag ")).toEqual(["MyTag"]);
	});

	it("ignores empty input", () => {
		expect(addTag([], "   ")).toEqual([]);
		expect(addTag(["react"], "")).toEqual(["react"]);
	});

	it("does not add duplicates ignoring case", () => {
		expect(addTag(["react"], "REACT")).toEqual(["react"]);
		expect(addTag(["MyTag"], "mytag")).toEqual(["MyTag"]);
	});

	it("does not mutate the original tag list", () => {
		const tags = ["react"];

		addTag(tags, "hooks");

		expect(tags).toEqual(["react"]);
	});
});

describe("removeTag", () => {
	it("removes a tag ignoring case", () => {
		expect(removeTag(["react", "hooks"], "REACT")).toEqual(["hooks"]);
	});

	it("keeps the list unchanged for unknown tags", () => {
		expect(removeTag(["react"], "missing")).toEqual(["react"]);
	});

	it("does not mutate the original tag list", () => {
		const tags = ["react", "hooks"];

		removeTag(tags, "react");

		expect(tags).toEqual(["react", "hooks"]);
	});
});
