"use client";

import {
	defaultKeymap,
	history,
	historyKeymap,
	indentWithTab,
} from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import {
	bracketMatching,
	HighlightStyle,
	indentOnInput,
	indentUnit,
	syntaxHighlighting,
} from "@codemirror/language";
import {
	Annotation,
	Compartment,
	EditorState,
	type Extension,
} from "@codemirror/state";
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

export type CodeEditorHandle = {
	getValue: () => string;
	setValue: (value: string) => void;
};

type CodeEditorProps = {
	value: string;
	language?: string;
	ariaLabel?: string;
	className?: string;
	readOnly?: boolean;
	onChange?: (value: string) => void;
	ref?: React.Ref<CodeEditorHandle>;
};

const programmaticChange = Annotation.define<boolean>();

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

const codeHighlightStyle = HighlightStyle.define([
	{
		tag: [
			tags.propertyName,
			tags.attributeName,
			tags.labelName,
			tags.definition(tags.propertyName),
			tags.definition(tags.variableName),
		],
		color: "var(--syntax-key)",
		fontWeight: "500",
	},
	{
		tag: [tags.string, tags.special(tags.string), tags.regexp],
		color: "var(--syntax-string)",
	},
	{
		tag: [tags.number, tags.integer, tags.float],
		color: "var(--syntax-number)",
	},
	{
		tag: [tags.bool, tags.null],
		color: "var(--syntax-boolean)",
	},
	{
		tag: [
			tags.keyword,
			tags.controlKeyword,
			tags.moduleKeyword,
			tags.operatorKeyword,
			tags.definitionKeyword,
			tags.typeName,
			tags.className,
			tags.tagName,
		],
		color: "var(--syntax-boolean)",
	},
	{
		tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment],
		color: "var(--muted-foreground)",
		fontStyle: "italic",
	},
	{
		tag: [
			tags.operator,
			tags.punctuation,
			tags.separator,
			tags.bracket,
			tags.angleBracket,
			tags.squareBracket,
			tags.paren,
			tags.brace,
		],
		color: "var(--muted-foreground)",
	},
]);

/**
 * Returns a CodeMirror language extension for a language name.
 * Unsupported languages fall back to plain text mode without fake highlighting.
 */
export function createLanguageExtension(language: string): Extension {
	switch (language.trim().toLowerCase()) {
		case "typescript":
		case "ts":
		case "tsx":
			return javascript({ typescript: true, jsx: true });
		case "javascript":
		case "js":
		case "jsx":
		case "mjs":
		case "cjs":
			return javascript({ jsx: true });
		case "json":
			return json();
		case "html":
		case "htm":
		case "xml":
		case "svg":
			return html();
		case "css":
		case "scss":
		case "less":
			return css();
		case "python":
		case "py":
			return python();
		case "sql":
			return sql();
		default:
			return [];
	}
}

function createReadOnlyExtension(readOnly: boolean): Extension {
	return readOnly
		? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
		: [];
}

function replaceDocument(
	view: EditorView | null,
	nextValue: string,
	historyCompartment?: Compartment,
) {
	if (!view || view.state.doc.toString() === nextValue) {
		return;
	}

	view.dispatch({
		changes: {
			from: 0,
			to: view.state.doc.length,
			insert: nextValue,
		},
		effects: historyCompartment
			? historyCompartment.reconfigure(history())
			: undefined,
		annotations: programmaticChange.of(true),
	});
}

export function CodeEditor({
	value,
	language = "",
	ariaLabel = "Code editor",
	className,
	readOnly = false,
	onChange,
	ref,
}: CodeEditorProps) {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const viewRef = React.useRef<EditorView | null>(null);
	const valueRef = React.useRef(value);
	const languageRef = React.useRef(language);
	const ariaLabelRef = React.useRef(ariaLabel);
	const readOnlyRef = React.useRef(readOnly);
	const languageCompartmentRef = React.useRef(new Compartment());
	const historyCompartmentRef = React.useRef(new Compartment());
	const readOnlyCompartmentRef = React.useRef(new Compartment());
	const onChangeRef = React.useRef(onChange);

	React.useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	React.useImperativeHandle(
		ref,
		() => ({
			getValue: () => viewRef.current?.state.doc.toString() ?? valueRef.current,
			setValue: (nextValue: string) => {
				valueRef.current = nextValue;
				replaceDocument(viewRef.current, nextValue);
			},
		}),
		[],
	);

	React.useEffect(() => {
		const container = containerRef.current;

		if (!container) {
			return;
		}

		const state = EditorState.create({
			doc: valueRef.current,
			extensions: [
				lineNumbers(),
				highlightActiveLineGutter(),
				highlightSpecialChars(),
				historyCompartmentRef.current.of(history()),
				drawSelection(),
				dropCursor(),
				indentOnInput(),
				bracketMatching(),
				highlightActiveLine(),
				EditorView.lineWrapping,
				EditorState.tabSize.of(2),
				indentUnit.of("  "),
				languageCompartmentRef.current.of(
					createLanguageExtension(languageRef.current),
				),
				readOnlyCompartmentRef.current.of(
					createReadOnlyExtension(readOnlyRef.current),
				),
				syntaxHighlighting(codeHighlightStyle),
				editorTheme,
				keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
				EditorView.updateListener.of((update) => {
					const isProgrammatic = update.transactions.some((transaction) =>
						transaction.annotation(programmaticChange),
					);

					if (update.docChanged && !isProgrammatic) {
						onChangeRef.current?.(update.state.doc.toString());
					}
				}),
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

		viewRef.current = view;

		return () => {
			viewRef.current = null;
			view.destroy();
		};
	}, []);

	React.useEffect(() => {
		valueRef.current = value;
		// Replacing the document also resets undo history so that undoing a
		// document swap cannot restore the content of a previously open tab.
		replaceDocument(viewRef.current, value, historyCompartmentRef.current);
	}, [value]);

	React.useEffect(() => {
		const view = viewRef.current;

		if (!view) {
			return;
		}

		view.dispatch({
			effects: languageCompartmentRef.current.reconfigure(
				createLanguageExtension(language),
			),
		});
	}, [language]);

	React.useEffect(() => {
		readOnlyRef.current = readOnly;

		const view = viewRef.current;

		if (!view) {
			return;
		}

		view.dispatch({
			effects: readOnlyCompartmentRef.current.reconfigure(
				createReadOnlyExtension(readOnly),
			),
		});
	}, [readOnly]);

	return (
		<div
			ref={containerRef}
			data-slot="code-editor"
			className={cn(
				"bg-card focus-within:ring-ring/30 h-full min-h-0 overflow-hidden focus-within:ring-2 focus-within:ring-inset",
				className,
			)}
		/>
	);
}
