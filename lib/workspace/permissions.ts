import type { MemberRole } from "./types";

export type UserRole = MemberRole | "owner";

export interface ProjectAccess {
  canView: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canManageMembers: boolean;
  role: UserRole;
}

export function getUserProjectAccess(
  isOwner: boolean,
  memberRole?: MemberRole,
): ProjectAccess {
  if (isOwner) {
    return {
      canView: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canManageMembers: true,
      role: "owner",
    };
  }

  switch (memberRole) {
    case "admin":
      return {
        canView: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canManageMembers: true,
        role: "admin",
      };
    case "editor":
      return {
        canView: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canManageMembers: false,
        role: "editor",
      };
    case "reporter":
      return {
        canView: true,
        canEditTasks: false,
        canDeleteTasks: false,
        canManageMembers: false,
        role: "reporter",
      };
    case "viewer":
    default:
      return {
        canView: true,
        canEditTasks: false,
        canDeleteTasks: false,
        canManageMembers: false,
        role: "viewer",
      };
  }
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    owner: "Ägare",
    admin: "Administratör",
    editor: "Redigerare",
    viewer: "Betraktare",
    reporter: "Rapportörer",
  };
  return labels[role] || role;
}

export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    owner: "Fullständig åtkomst, äger projektet",
    admin: "Kan redigera, ta bort och hantera medlemmar",
    editor: "Kan redigera uppgifter",
    viewer: "Kan bara visa uppgifter",
    reporter: "Kan bara se rapporter",
  };
  return descriptions[role] || "";
}
