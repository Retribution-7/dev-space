"use client";

import { Add01Icon, Cancel01Icon, TagsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";

import {
	addTag,
	getTagSuggestions,
	removeTag,
	type TagSuggestion,
} from "../model/snippet-tags";

type TagInputProps = {
	tags: string[];
	onChange: (tags: string[]) => void;
	id?: string;
	placeholder?: string;
	ariaDescribedBy?: string;
	disabled?: boolean;
};

export function TagInput({
	tags,
	onChange,
	id,
	placeholder = "e.g. react, hooks",
	ariaDescribedBy,
	disabled = false,
}: TagInputProps) {
	const listboxId = `${id ?? "tag-input"}-suggestions`;
	const [query, setQuery] = React.useState("");
	const [isFocused, setIsFocused] = React.useState(false);
	const [activeIndex, setActiveIndex] = React.useState(0);

	const suggestions: TagSuggestion[] =
		isFocused && query.trim() !== "" ? getTagSuggestions(query, tags) : [];
	const currentActiveIndex =
		suggestions.length > 0 ? Math.min(activeIndex, suggestions.length - 1) : 0;
	const activeOptionId =
		suggestions.length > 0 ? `${listboxId}-${currentActiveIndex}` : undefined;

	function commit(value: string) {
		const nextTags = addTag(tags, value);

		if (nextTags !== tags) {
			onChange(nextTags);
		}

		setQuery("");
		setActiveIndex(0);
	}

	function handleSelectSuggestion(suggestion: TagSuggestion) {
		commit(suggestion.tag);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Enter") {
			event.preventDefault();
			const suggestion = suggestions[currentActiveIndex];
			commit(suggestion ? suggestion.tag : query);
			return;
		}

		if (event.key === " ") {
			event.preventDefault();
			commit(query);
			return;
		}

		if (event.key === "ArrowDown" && suggestions.length > 0) {
			event.preventDefault();
			setActiveIndex((current) => (current + 1) % suggestions.length);
			return;
		}

		if (event.key === "ArrowUp" && suggestions.length > 0) {
			event.preventDefault();
			setActiveIndex(
				(current) => (current - 1 + suggestions.length) % suggestions.length,
			);
		}
	}

	function handleBlur() {
		setIsFocused(false);

		if (query.trim() !== "") {
			commit(query);
		}
	}

	return (
		<div className="relative">
			<div className="border-input focus-within:border-ring focus-within:ring-ring/50 flex flex-wrap items-center gap-1 rounded-lg border p-1.5 focus-within:ring-3">
				{tags.map((tag) => (
					<Badge key={tag} variant="secondary" className="max-w-full pr-1">
						<span className="truncate">{tag}</span>
						<button
							type="button"
							title={`Remove ${tag}`}
							aria-label={`Remove ${tag} tag`}
							// Keep focus in the input so removing a chip never triggers
							// blur side effects or form actions.
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => onChange(removeTag(tags, tag))}
							className="text-muted-foreground hover:text-destructive rounded-sm"
						>
							<HugeiconsIcon
								icon={Cancel01Icon}
								className="size-3"
								aria-hidden="true"
							/>
						</button>
					</Badge>
				))}

				<Input
					id={id}
					type="text"
					role="combobox"
					value={query}
					disabled={disabled}
					placeholder={tags.length === 0 ? placeholder : ""}
					aria-describedby={ariaDescribedBy}
					aria-autocomplete="list"
					aria-controls={suggestions.length > 0 ? listboxId : undefined}
					aria-expanded={suggestions.length > 0}
					aria-activedescendant={activeOptionId}
					onChange={(event) => {
						setQuery(event.target.value);
						setActiveIndex(0);
					}}
					onFocus={() => setIsFocused(true)}
					onBlur={handleBlur}
					onKeyDown={handleKeyDown}
					className="h-6 min-w-24 flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
				/>
			</div>

			{suggestions.length > 0 ? (
				<div className="absolute top-full right-0 left-0 z-20 mt-1">
					<Command
						shouldFilter={false}
						className="bg-popover text-popover-foreground rounded-lg border shadow-lg"
					>
						<CommandList id={listboxId} className="max-h-48">
							{suggestions.map((suggestion, index) => (
								<CommandItem
									key={`${suggestion.type}-${suggestion.tag}`}
									id={`${listboxId}-${index}`}
									value={`${suggestion.type}-${suggestion.tag}`}
									data-active={index === currentActiveIndex}
									// Prevent the input blur so the click is handled first.
									onMouseDown={(event) => event.preventDefault()}
									onMouseMove={() => setActiveIndex(index)}
									onSelect={() => handleSelectSuggestion(suggestion)}
									className={cn(
										"gap-2 text-xs",
										index === currentActiveIndex
											? "bg-muted text-foreground"
											: "text-muted-foreground",
									)}
								>
									<HugeiconsIcon
										icon={suggestion.type === "custom" ? Add01Icon : TagsIcon}
										className="size-3.5 shrink-0"
										aria-hidden="true"
									/>
									{suggestion.type === "custom" ? (
										<span className="truncate">
											Add &quot;{suggestion.tag}&quot;
										</span>
									) : (
										<span className="truncate">{suggestion.tag}</span>
									)}
								</CommandItem>
							))}
						</CommandList>
					</Command>
				</div>
			) : null}
		</div>
	);
}
