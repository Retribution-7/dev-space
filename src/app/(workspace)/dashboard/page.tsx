export default function DashboardPage() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div>
				<h2 className="text-xl font-semibold">WorkspaceLayout preview</h2>
				<p className="text-muted-foreground text-sm">
					Test page to verify the workspace shell implemented by the
					WorkspaceLayout widget.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-lg border p-4">
					<h3 className="font-medium">Sidebar</h3>
					<p className="text-muted-foreground mt-1 text-sm">
						AppSidebar with tools navigation, active route highlighting,
						collapsible icon mode (Ctrl+B) and tooltips.
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<h3 className="font-medium">Header</h3>
					<p className="text-muted-foreground mt-1 text-sm">
						AppHeader with sidebar trigger, current section title and theme
						toggle (light/dark).
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<h3 className="font-medium">Content area</h3>
					<p className="text-muted-foreground mt-1 text-sm">
						This block renders inside SidebarInset via layout children — the
						place for future tool pages.
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<h3 className="font-medium">Try it</h3>
					<p className="text-muted-foreground mt-1 text-sm">
						Collapse the sidebar, toggle the theme in the header, resize the
						window to check the mobile drawer.
					</p>
				</div>
			</div>
		</div>
	);
}
