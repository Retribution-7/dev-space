"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type UnsavedChangesDialogProps = {
	open: boolean;
	title?: string;
	description: ReactNode;
	onOpenChange: (open: boolean) => void;
	onSave: () => void;
	onDiscard: () => void;
	saveLabel?: string;
	discardLabel?: string;
};

export function UnsavedChangesDialog({
	open,
	title = "Unsaved changes",
	description,
	onOpenChange,
	onSave,
	onDiscard,
	saveLabel = "Save",
	discardLabel = "Discard",
}: UnsavedChangesDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button type="button" variant="destructive" onClick={onDiscard}>
						{discardLabel}
					</Button>
					<Button type="button" onClick={onSave}>
						{saveLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
