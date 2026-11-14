import { WelcomeSection, WorkspaceOverview } from "@/widgets/dashboard";

export default function DashboardPage() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<WelcomeSection />
			<WorkspaceOverview />
		</div>
	);
}
