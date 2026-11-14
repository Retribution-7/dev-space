"use client";

import {
	defaultKeymap,
	history,
	historyKeymap,
	indentWithTab,
} from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import {
	bracketMatching,
	HighlightStyle,
	indentOnInput,
	indentUnit,
	syntaxHighlighting,
} from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import {
	drawSelection,
	dropCursor,
	EditorView,
	highlightActiveLine,
	highlightActiveLineGutter,
	highlightSpecialChars,
	keymap,
	lineNumbers,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

type JsonEditorProps = {
	initialValue: string;
	ariaLabel?: string;
	className?: string;
};

const editorTheme = EditorView.theme(
	{
		"&": {
			height: "100%",
			backgroundColor: "transparent",
			color: "var(--foreground)",
			fontSize: "0.8125rem",
		},
		"&.cm-focused": {
			outline: "none",
		},
		".cm-scroller": {
			fontFamily:
				"var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
			lineHeight: "1.7",
			overflow: "auto",
			scrollbarColor: "var(--border) transparent",
			scrollbarWidth: "thin",
		},
		".cm-content": {
			padding: "0.875rem 0",
			caretColor: "var(--primary)",
		},
		".cm-line": {
			padding: "0 1rem 0 0.75rem",
		},
		".cm-gutters": {
			backgroundColor: "color-mix(in oklch, var(--muted) 55%, transparent)",
			borderRight: "1px solid var(--border)",
			color: "var(--muted-foreground)",
		},
		".cm-lineNumbers .cm-gutterElement": {
			minWidth: "2.5rem",
			padding: "0 0.75rem 0 0.625rem",
			fontVariantNumeric: "tabular-nums",
		},
		".cm-activeLine": {
			backgroundColor: "color-mix(in oklch, var(--primary) 5%, transparent)",
		},
		".cm-activeLineGutter": {
			backgroundColor: "color-mix(in oklch, var(--primary) 8%, transparent)",
			color: "var(--foreground)",
		},
		".cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection":
			{
				backgroundColor: "color-mix(in oklch, var(--primary) 24%, transparent)",
			},
		".cm-cursor, .cm-dropCursor": {
			borderLeftColor: "var(--primary)",
		},
		".cm-matchingBracket": {
			backgroundColor: "color-mix(in oklch, var(--primary) 18%, transparent)",
			borderRadius: "2px",
			outline: "1px solid color-mix(in oklch, var(--primary) 40%, transparent)",
		},
		".cm-nonmatchingBracket": {
			color: "var(--destructive)",
		},
	},
	{ dark: false },
);

const jsonHighlightStyle = HighlightStyle.define([
	{
		tag: tags.propertyName,
		color: "var(--syntax-key)",
		fontWeight: "500",
	},
	{
		tag: tags.string,
		color: "var(--syntax-string)",
	},
	{
		tag: tags.number,
		color: "var(--syntax-number)",
	},
	{
		tag: tags.bool,
		color: "var(--syntax-boolean)",
	},
	{
		tag: tags.null,
		color: "var(--muted-foreground)",
		fontStyle: "italic",
	},
	{
		tag: [tags.brace, tags.squareBracket, tags.separator],
		color: "var(--muted-foreground)",
	},
]);

export function JsonEditor({
	initialValue,
	ariaLabel = "JSON editor",
	className,
}: JsonEditorProps) {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const initialValueRef = React.useRef(initialValue);
	const ariaLabelRef = React.useRef(ariaLabel);

	React.useEffect(() => {
		const container = containerRef.current;

		if (!container) {
			return;
		}

		const state = EditorState.create({
			doc: initialValueRef.current,
			extensions: [
				lineNumbers(),
				highlightActiveLineGutter(),
				highlightSpecialChars(),
				history(),
				drawSelection(),
				dropCursor(),
				indentOnInput(),
				bracketMatching(),
				highlightActiveLine(),
				EditorView.lineWrapping,
				EditorState.tabSize.of(2),
				indentUnit.of("  "),
				json(),
				syntaxHighlighting(jsonHighlightStyle),
				editorTheme,
				keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
				EditorView.contentAttributes.of({
					"aria-label": ariaLabelRef.current,
					"aria-multiline": "true",
					autocapitalize: "off",
					autocomplete: "off",
					spellcheck: "false",
				}),
			],
		});

		const view = new EditorView({
			state,
			parent: container,
		});

		return () => {
			view.destroy();
		};
	}, []);

	return (
		<div
			ref={containerRef}
			data-slot="json-editor"
			className={cn(
				"bg-card focus-within:ring-ring/30 h-full min-h-0 overflow-hidden focus-within:ring-2 focus-within:ring-inset",
				className,
			)}
		/>
	);
}
