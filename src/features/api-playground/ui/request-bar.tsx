"use client";

import {
	Cancel01Icon,
	Loading03Icon,
	SentIcon,
} from "@hugeicons/core-free-icons";
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
import { cn } from "@/shared/lib/utils";

import { HTTP_METHODS, type HttpMethod } from "../model/types";

type RequestBarProps = {
	method: HttpMethod;
	url: string;
	isSending: boolean;
	onMethodChange: (method: HttpMethod) => void;
	onUrlChange: (url: string) => void;
	onSubmit: () => void;
	onCancel: () => void;
};

const HTTP_METHOD_ITEMS = HTTP_METHODS.map((method) => ({
	value: method,
	label: method,
}));

export function RequestBar({
	method,
	url,
	isSending,
	onMethodChange,
	onUrlChange,
	onSubmit,
	onCancel,
}: RequestBarProps) {
	const canSubmit = !isSending;
	const sendTitle = isSending ? "A request is already in progress" : undefined;

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
			aria-busy={isSending}
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

			<div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
				<Button
					type="submit"
					disabled={!canSubmit}
					className="flex-1 sm:flex-none"
					title={sendTitle}
				>
					<HugeiconsIcon
						icon={isSending ? Loading03Icon : SentIcon}
						className={cn("size-3.5", isSending && "animate-spin")}
						data-icon="inline-start"
						aria-hidden="true"
					/>
					{isSending ? "Sending..." : "Send"}
				</Button>

				{isSending ? (
					<Button
						type="button"
						variant="outline"
						className="flex-1 sm:flex-none"
						onClick={onCancel}
					>
						<HugeiconsIcon
							icon={Cancel01Icon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Cancel
					</Button>
				) : null}
			</div>
		</form>
	);
}
