import type * as React from "react";

type FormFieldProps = {
	id: string;
	label: string;
	required?: boolean;
	hint?: string;
	error?: string;
	children: React.ReactNode;
};

export function FormField({
	id,
	label,
	required = false,
	hint,
	error,
	children,
}: FormFieldProps) {
	return (
		<div className="grid content-start gap-1.5">
			<label htmlFor={id} className="text-sm font-medium">
				{label}
				{required ? (
					<span className="text-destructive" aria-hidden="true">
						{" "}
						*
					</span>
				) : null}
			</label>
			{children}
			{hint && !error ? (
				<p id={`${id}-hint`} className="text-muted-foreground text-xs">
					{hint}
				</p>
			) : null}
			{error ? (
				<p id={`${id}-error`} className="text-destructive text-xs" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
