import { WorkspaceDashboard } from "@/components/workspace-dashboard";
import { getWorkspaceData } from "@/lib/workspace/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const workspace = await getWorkspaceData();

  return <WorkspaceDashboard {...workspace} />;
}
