import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RecentToolsTracker } from "@/features/recent-tools";
import { AppHeader } from "@/widgets/header";
import { AppSidebar } from "@/widgets/sidebar";

type WorkspaceLayoutProps = {
	children: ReactNode;
};

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
	return (
		<SidebarProvider>
			<RecentToolsTracker />
			<AppSidebar />
			<SidebarInset>
				<AppHeader />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
