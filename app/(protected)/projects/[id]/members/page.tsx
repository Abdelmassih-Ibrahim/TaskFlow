import { notFound } from "next/navigation";
import { ProjectMembersContent } from "@/components/project-members-content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Invitation, ProjectMember } from "@/lib/workspace/types";

export const dynamic = "force-dynamic";

export default async function ProjectMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();

  const [{ data: userData }, { data: project }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("projects").select("id, name, owner_id").eq("id", id).maybeSingle(),
  ]);
  if (!project) notFound();

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("project_members")
      .select("*")
      .eq("project_id", id)
      .not("joined_at", "is", null)
      .order("joined_at", { ascending: true }),
    supabase
      .from("invitations")
      .select("*")
      .eq("project_id", id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const isOwner = userData.user?.id === project.owner_id;

  return (
    <ProjectMembersContent
      project={{ id: project.id, name: project.name }}
      ownerId={project.owner_id}
      members={(members ?? []) as ProjectMember[]}
      invitations={isOwner ? ((invitations ?? []) as Invitation[]) : []}
      isOwner={isOwner}
    />
  );
}
