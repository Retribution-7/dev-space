import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/widgets/workspace";

export default function Layout({ children }: { children: ReactNode }) {
	return <WorkspaceLayout>{children}</WorkspaceLayout>;
}
