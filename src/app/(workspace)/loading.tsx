import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
	return (
		<div
			role="status"
			aria-label="Loading workspace content"
			className="flex flex-1 flex-col gap-6 p-6"
		>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-7 w-48 max-w-full" />
				<Skeleton className="h-4 w-80 max-w-full" />
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="size-8" />
				</div>
			</div>

			<div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<div className="flex min-w-0 flex-col rounded-lg border p-4 sm:p-6">
					<div className="flex items-center justify-between gap-4">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-6 w-16" />
					</div>
					<div className="mt-4 flex flex-1 flex-col gap-3 rounded-md border p-4">
						<Skeleton className="h-3 w-11/12" />
						<Skeleton className="h-3 w-4/5" />
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-3/5" />
						<Skeleton className="h-3 w-2/3" />
					</div>
					<div className="mt-4 flex flex-wrap items-center gap-2">
						<Skeleton className="h-8 w-24" />
						<Skeleton className="h-8 w-20" />
						<Skeleton className="ml-auto h-8 w-20" />
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
					<div className="rounded-lg border p-4">
						<Skeleton className="h-4 w-24" />
						<div className="mt-3 flex flex-col gap-2">
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-4/5" />
						</div>
					</div>
					<div className="rounded-lg border p-4">
						<Skeleton className="h-4 w-28" />
						<div className="mt-3 flex flex-col gap-2">
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-3/5" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
