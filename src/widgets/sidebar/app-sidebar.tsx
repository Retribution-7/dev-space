"use client";

import { CodeIcon, DashboardSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { toolNavItems } from "@/shared/config/tools";

const navItems = [
	{ title: "Dashboard", url: "/dashboard", icon: DashboardSquare01Icon },
	...toolNavItems,
];

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar>
			<SidebarHeader>
				<div className="flex items-center gap-2 px-2 py-1.5">
					<div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg">
						<HugeiconsIcon icon={CodeIcon} className="size-4" />
					</div>
					<div className="grid flex-1 text-left leading-tight">
						<span className="truncate font-semibold">DevSpace</span>
						<span className="text-sidebar-foreground/70 truncate text-xs">
							Developer Toolkit
						</span>
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Tools</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const isActive =
									pathname === item.url || pathname.startsWith(`${item.url}/`);
								return (
									<SidebarMenuItem key={item.url}>
										<SidebarMenuButton
											render={<Link href={item.url} />}
											isActive={isActive}
											tooltip={item.title}
										>
											<HugeiconsIcon icon={item.icon} />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
