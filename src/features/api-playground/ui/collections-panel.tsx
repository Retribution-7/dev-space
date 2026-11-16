"use client";

import {
	Add01Icon,
	Delete02Icon,
	Edit02Icon,
	FolderIcon,
	InboxIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";

import type {
	CollectionSavedRequest,
	RequestCollection,
} from "../model/request-collections";
import { toCollectionRequestDraft } from "../model/request-collections";
import type { RequestDraft } from "../model/types";
import {
	useRequestCollections,
	useRequestCollectionsHydration,
} from "../model/use-request-collections";

import { ConfirmDialog } from "./confirm-dialog";
import { EmptyState } from "./empty-state";
import { PanelHeader } from "./panel-header";

type CollectionsPanelProps = {
	draft: RequestDraft;
	onRestore: (draft: RequestDraft) => void;
	onSaved?: () => void;
	className?: string;
};

type CollectionFormDialogProps = {
	open: boolean;
	title: string;
	description: string;
	submitLabel: string;
	initialName?: string;
	initialDescription?: string;
	onClose: () => void;
	onSubmit: (values: { name: string; description: string }) => void;
};

type RequestNameDialogProps = {
	open: boolean;
	title: string;
	description: string;
	submitLabel: string;
	initialName?: string;
	onClose: () => void;
	onSubmit: (name: string) => void;
};

type DeleteTarget =
	| { type: "collection"; id: string; name: string }
	| {
			type: "request";
			collectionId: string;
			requestId: string;
			name: string;
	  };

export function CollectionsPanel({
	draft,
	onRestore,
	onSaved,
	className,
}: CollectionsPanelProps) {
	const {
		collections,
		createCollection,
		updateCollection,
		deleteCollection,
		saveRequest,
		renameRequest,
		deleteRequest,
	} = useRequestCollections();
	const hasHydrated = useRequestCollectionsHydration();
	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [editingCollection, setEditingCollection] =
		React.useState<RequestCollection | null>(null);
	const [saveTarget, setSaveTarget] = React.useState<RequestCollection | null>(
		null,
	);
	const [renameTarget, setRenameTarget] = React.useState<{
		collectionId: string;
		request: CollectionSavedRequest;
	} | null>(null);
	const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(
		null,
	);

	return (
		<Card
			role="region"
			aria-label="Collections"
			className={cn(
				"h-full gap-0 rounded-none border-0 py-0 shadow-none",
				className,
			)}
		>
			<PanelHeader
				icon={FolderIcon}
				title="Collections"
				action={
					hasHydrated ? (
						<Button
							type="button"
							size="sm"
							onClick={() => setIsCreateOpen(true)}
						>
							<HugeiconsIcon
								icon={Add01Icon}
								className="size-4"
								data-icon="inline-start"
								aria-hidden="true"
							/>
							New collection
						</Button>
					) : null
				}
			/>

			<CardContent className="flex flex-1 flex-col p-0">
				{!hasHydrated ? (
					<CollectionsSkeleton />
				) : collections.length === 0 ? (
					<EmptyCollectionsState />
				) : (
					<div>
						{collections.map((collection) => (
							<CollectionItem
								key={collection.id}
								collection={collection}
								onSaveRequest={setSaveTarget}
								onEdit={setEditingCollection}
								onDelete={(id, name) =>
									setDeleteTarget({ type: "collection", id, name })
								}
								onRestore={onRestore}
								onRenameRequest={(request) =>
									setRenameTarget({ collectionId: collection.id, request })
								}
								onDeleteRequest={(requestId, name) =>
									setDeleteTarget({
										type: "request",
										collectionId: collection.id,
										requestId,
										name,
									})
								}
							/>
						))}
					</div>
				)}
			</CardContent>

			{isCreateOpen ? (
				<CollectionFormDialog
					key="collection-create"
					open
					title="New collection"
					description="Create a collection to organize saved API requests."
					submitLabel="Create collection"
					onClose={() => setIsCreateOpen(false)}
					onSubmit={({ name, description }) => {
						createCollection({ name, description });
						setIsCreateOpen(false);
					}}
				/>
			) : null}

			{editingCollection ? (
				<CollectionFormDialog
					key={editingCollection.id}
					open
					title="Edit collection"
					description="Update the collection name or description."
					submitLabel="Save changes"
					initialName={editingCollection.name}
					initialDescription={editingCollection.description}
					onClose={() => setEditingCollection(null)}
					onSubmit={({ name, description }) => {
						updateCollection(editingCollection.id, { name, description });
						setEditingCollection(null);
					}}
				/>
			) : null}

			{saveTarget ? (
				<RequestNameDialog
					key={`save-${saveTarget.id}`}
					open
					title="Save request"
					description={`Save the current request configuration to "${saveTarget.name}".`}
					submitLabel="Save request"
					initialName={getDefaultRequestName(draft)}
					onClose={() => setSaveTarget(null)}
					onSubmit={(name) => {
						saveRequest(saveTarget.id, { name, draft });
						setSaveTarget(null);
						onSaved?.();
					}}
				/>
			) : null}

			{renameTarget ? (
				<RequestNameDialog
					key={`rename-${renameTarget.request.id}`}
					open
					title="Rename request"
					description="Choose a new name for this saved request."
					submitLabel="Save name"
					initialName={renameTarget.request.name}
					onClose={() => setRenameTarget(null)}
					onSubmit={(name) => {
						renameRequest(
							renameTarget.collectionId,
							renameTarget.request.id,
							name,
						);
						setRenameTarget(null);
					}}
				/>
			) : null}

			<ConfirmDialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTarget(null);
					}
				}}
				title={
					deleteTarget?.type === "collection"
						? "Delete collection?"
						: "Delete saved request?"
				}
				description={
					deleteTarget?.type === "collection"
						? `This removes "${deleteTarget.name}" and all of its saved requests. Request history is not affected.`
						: `This removes "${deleteTarget?.name ?? ""}" from the collection. Request history is not affected.`
				}
				confirmLabel={
					deleteTarget?.type === "collection"
						? "Delete collection"
						: "Delete request"
				}
				destructive
				onConfirm={() => {
					if (deleteTarget?.type === "collection") {
						deleteCollection(deleteTarget.id);
					} else if (deleteTarget?.type === "request") {
						deleteRequest(deleteTarget.collectionId, deleteTarget.requestId);
					}

					setDeleteTarget(null);
				}}
			/>
		</Card>
	);
}

type CollectionItemProps = {
	collection: RequestCollection;
	onSaveRequest: (collection: RequestCollection) => void;
	onEdit: (collection: RequestCollection) => void;
	onDelete: (id: string, name: string) => void;
	onRestore: (draft: RequestDraft) => void;
	onRenameRequest: (request: CollectionSavedRequest) => void;
	onDeleteRequest: (requestId: string, name: string) => void;
};

function CollectionItem({
	collection,
	onSaveRequest,
	onEdit,
	onDelete,
	onRestore,
	onRenameRequest,
	onDeleteRequest,
}: CollectionItemProps) {
	return (
		<div className="border-b last:border-b-0">
			<div className="flex flex-wrap items-start gap-2 px-3 py-2.5">
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{collection.name}</p>
					{collection.description ? (
						<p className="text-muted-foreground mt-0.5 truncate text-xs">
							{collection.description}
						</p>
					) : null}
					<p className="text-muted-foreground mt-1 text-[0.7rem]">
						{collection.requests.length} saved{" "}
						{collection.requests.length === 1 ? "request" : "requests"} ·
						Updated {formatCollectionTimestamp(collection.updatedAt)}
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					<Button
						type="button"
						variant="outline"
						size="xs"
						onClick={() => onSaveRequest(collection)}
					>
						<HugeiconsIcon
							icon={Add01Icon}
							className="size-3.5"
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Save current
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						className="text-muted-foreground hover:text-foreground"
						onClick={() => onEdit(collection)}
						aria-label={`Edit collection ${collection.name}`}
					>
						<HugeiconsIcon icon={Edit02Icon} className="size-3.5" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						className="text-muted-foreground hover:text-destructive"
						onClick={() => onDelete(collection.id, collection.name)}
						aria-label={`Delete collection ${collection.name}`}
					>
						<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
					</Button>
				</div>
			</div>

			{collection.requests.length === 0 ? (
				<p className="text-muted-foreground border-t px-3 py-3 text-xs">
					No saved requests in this collection yet.
				</p>
			) : (
				<ul className="divide-y border-t">
					{collection.requests.map((request) => (
						<li key={request.id} className="flex items-center gap-2 px-3 py-2">
							<button
								type="button"
								className="min-w-0 flex-1 text-left"
								onClick={() => onRestore(toCollectionRequestDraft(request))}
								title="Restore this request in the Request Builder"
							>
								<p className="truncate text-xs font-medium">{request.name}</p>
								<p className="text-muted-foreground truncate font-mono text-[0.7rem]">
									{request.draft.method} {request.draft.url}
								</p>
							</button>

							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								className="text-muted-foreground hover:text-foreground"
								onClick={() => onRenameRequest(request)}
								aria-label={`Rename request ${request.name}`}
							>
								<HugeiconsIcon icon={Edit02Icon} className="size-3.5" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								className="text-muted-foreground hover:text-destructive"
								onClick={() => onDeleteRequest(request.id, request.name)}
								aria-label={`Delete request ${request.name}`}
							>
								<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function CollectionFormDialog({
	open,
	title,
	description,
	submitLabel,
	initialName = "",
	initialDescription = "",
	onClose,
	onSubmit,
}: CollectionFormDialogProps) {
	const [name, setName] = React.useState(initialName);
	const [collectionDescription, setCollectionDescription] =
		React.useState(initialDescription);
	const [error, setError] = React.useState<string | null>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			onSubmit({ name, description: collectionDescription });
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Something went wrong.",
			);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose();
				}
			}}
		>
			<DialogContent showCloseButton={false}>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>

					<div className="grid gap-2">
						<label className="text-xs font-medium" htmlFor="collection-name">
							Name
						</label>
						<Input
							id="collection-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="My API collection"
							autoFocus
						/>
					</div>

					<div className="grid gap-2">
						<label
							className="text-xs font-medium"
							htmlFor="collection-description"
						>
							Description
						</label>
						<Textarea
							id="collection-description"
							value={collectionDescription}
							onChange={(event) => setCollectionDescription(event.target.value)}
							placeholder="Optional description"
						/>
					</div>

					{error ? (
						<p role="alert" className="text-destructive text-xs">
							{error}
						</p>
					) : null}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">{submitLabel}</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function RequestNameDialog({
	open,
	title,
	description,
	submitLabel,
	initialName = "",
	onClose,
	onSubmit,
}: RequestNameDialogProps) {
	const [name, setName] = React.useState(initialName);
	const [error, setError] = React.useState<string | null>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			onSubmit(name);
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Something went wrong.",
			);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose();
				}
			}}
		>
			<DialogContent showCloseButton={false}>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>

					<div className="grid gap-2">
						<label className="text-xs font-medium" htmlFor="request-name">
							Request name
						</label>
						<Input
							id="request-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="Get users"
							autoFocus
						/>
					</div>

					{error ? (
						<p role="alert" className="text-destructive text-xs">
							{error}
						</p>
					) : null}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">{submitLabel}</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function EmptyCollectionsState() {
	return (
		<EmptyState
			icon={InboxIcon}
			title="No collections yet"
			description="Create a collection to save request configurations for repeated use."
			className="flex-1"
		/>
	);
}

function CollectionsSkeleton() {
	return (
		<div
			role="status"
			aria-label="Loading request collections"
			className="flex flex-col gap-1 p-2"
		>
			{Array.from({ length: 2 }, (_, index) => (
				<div key={index} className="flex items-center gap-3 px-1 py-3">
					<div className="flex min-w-0 flex-1 flex-col gap-1.5">
						<Skeleton className="h-3.5 w-40 max-w-full" />
						<Skeleton className="h-3 w-24 max-w-full" />
					</div>
					<Skeleton className="h-6 w-20" />
				</div>
			))}
		</div>
	);
}

function getDefaultRequestName(draft: RequestDraft): string {
	if (draft.url.trim() === "") {
		return draft.method;
	}

	try {
		const parsedUrl = new URL(draft.url);

		return `${draft.method} ${parsedUrl.pathname}`;
	} catch {
		return draft.method;
	}
}

function formatCollectionTimestamp(value: string): string {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "unknown time";
	}

	return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
