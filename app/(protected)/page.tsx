import { WorkspaceDashboard } from "@/components/workspace-dashboard";
import { getWorkspaceData } from "@/lib/workspace/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; projekt?: string }>;
}) {
  const [{ error, projekt }, workspace] = await Promise.all([
    searchParams,
    getWorkspaceData(),
  ]);
  const initialProjectId =
    projekt && workspace.projects.some((project) => project.id === projekt)
      ? projekt
      : "";

  return (
    <WorkspaceDashboard
      key={initialProjectId || "all"}
      {...workspace}
      initialProjectId={initialProjectId}
      signOutError={error === "sign-out"}
    />
  );
}
