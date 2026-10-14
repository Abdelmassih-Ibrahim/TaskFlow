import { WorkspaceDashboard } from "@/components/workspace-dashboard";
import { getWorkspaceData } from "@/lib/workspace/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, workspace] = await Promise.all([
    searchParams,
    getWorkspaceData(),
  ]);

  return (
    <WorkspaceDashboard
      {...workspace}
      signOutError={error === "sign-out"}
    />
  );
}
