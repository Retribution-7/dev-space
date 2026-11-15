import { cn } from "cn";
import * as React from "react";

function Select({ className, ...props }: React.ComponentProps<"select">) {
	return (
		<select
			data-slot="select"
			className={cn(
				"border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&>option]:bg-background [&>option]:text-foreground h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base scheme-light transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm dark:scheme-dark",
				className,
			)}
			{...props}
		/>
	);
}

export { Select };
