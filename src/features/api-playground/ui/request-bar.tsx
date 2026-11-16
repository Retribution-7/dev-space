"use client";

import { SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { HTTP_METHODS, type HttpMethod } from "../model/types";

type RequestBarProps = {
	method: HttpMethod;
	url: string;
	onMethodChange: (method: HttpMethod) => void;
	onUrlChange: (url: string) => void;
	onSubmit: () => void;
};

const HTTP_METHOD_ITEMS = HTTP_METHODS.map((method) => ({
	value: method,
	label: method,
}));

export function RequestBar({
	method,
	url,
	onMethodChange,
	onUrlChange,
	onSubmit,
}: RequestBarProps) {
	const canSubmit = url.trim() !== "";

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (canSubmit) {
			onSubmit();
		}
	}

	return (
		<form
			className="flex flex-col gap-2 sm:flex-row sm:items-center"
			onSubmit={handleSubmit}
		>
			<div className="flex min-w-0 flex-1 items-center gap-2">
				<Select
					value={method}
					items={HTTP_METHOD_ITEMS}
					onValueChange={(value) => {
						if (value) {
							onMethodChange(value as HttpMethod);
						}
					}}
				>
					<SelectTrigger
						type="button"
						className="w-24 shrink-0 font-mono text-xs"
						aria-label="HTTP method"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{HTTP_METHODS.map((item) => (
							<SelectItem key={item} value={item} className="font-mono text-xs">
								{item}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<InputGroup className="min-w-0 flex-1">
					<InputGroupInput
						type="text"
						value={url}
						onChange={(event) => onUrlChange(event.target.value)}
						placeholder="https://api.example.com/resource"
						aria-label="Request URL"
						autoComplete="off"
						inputMode="url"
						spellCheck={false}
						className="font-mono text-xs"
					/>
				</InputGroup>
			</div>

			<Button
				type="submit"
				disabled={!canSubmit}
				className="w-full shrink-0 sm:w-auto"
				title={canSubmit ? undefined : "Enter a request URL first"}
			>
				<HugeiconsIcon
					icon={SentIcon}
					className="size-3.5"
					data-icon="inline-start"
					aria-hidden="true"
				/>
				Send
			</Button>
		</form>
	);
}
