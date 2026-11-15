import type { SnippetCategory } from "./snippet-categories";

export type Snippet = {
	id: string;
	title: string;
	description: string;
	code: string;
	language: string;
	category: SnippetCategory;
	tags: string[];
	isFavorite: boolean;
	createdAt: string;
	updatedAt: string;
};

export type SnippetDraft = Pick<
	Snippet,
	"title" | "description" | "code" | "language" | "category" | "tags"
>;
