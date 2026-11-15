"use client";

import * as React from "react";

import { CodeEditor, type CodeEditorHandle } from "@/components/ui/code-editor";

export type JsonEditorHandle = {
	getValue: () => string;
	setValue: (value: string) => void;
};

type JsonEditorProps = {
	initialValue: string;
	ariaLabel?: string;
	className?: string;
	onChange?: (value: string) => void;
	ref?: React.Ref<JsonEditorHandle>;
};

export function JsonEditor({
	initialValue,
	ariaLabel = "JSON editor",
	className,
	onChange,
	ref,
}: JsonEditorProps) {
	const editorRef = React.useRef<CodeEditorHandle>(null);

	React.useImperativeHandle(ref, () => ({
		getValue: () => editorRef.current?.getValue() ?? initialValue,
		setValue: (value: string) => editorRef.current?.setValue(value),
	}));

	return (
		<CodeEditor
			ref={editorRef}
			value={initialValue}
			language="json"
			ariaLabel={ariaLabel}
			className={className}
			onChange={onChange}
		/>
	);
}
