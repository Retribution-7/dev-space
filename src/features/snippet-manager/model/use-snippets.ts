"use client";

import { useCallback, useState } from "react";

import {
	createSnippet as createSnippetRecord,
	removeSnippet,
	updateSnippet as updateSnippetRecord,
} from "./snippet-operations";
import type { Snippet, SnippetDraft } from "./types";

export function useSnippets() {
	const [snippets, setSnippets] = useState<Snippet[]>([]);

	const createSnippet = useCallback((draft: SnippetDraft) => {
		const snippet = createSnippetRecord(draft, {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
		});

		setSnippets((current) => [snippet, ...current]);
	}, []);

	const updateSnippet = useCallback((id: string, draft: SnippetDraft) => {
		const timestamp = new Date().toISOString();

		setSnippets((current) =>
			current.map((snippet) =>
				snippet.id === id
					? updateSnippetRecord(snippet, draft, timestamp)
					: snippet,
			),
		);
	}, []);

	const deleteSnippet = useCallback((id: string) => {
		setSnippets((current) => removeSnippet(current, id));
	}, []);

	return { snippets, createSnippet, updateSnippet, deleteSnippet };
}
