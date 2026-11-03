import type { MemberRole } from "./types";

const roleLabels: Record<MemberRole | "owner", string> = {
  owner: "Ägare",
  admin: "Administratör",
  editor: "Redigerare",
  viewer: "Betraktare",
  reporter: "Rapportör",
};

export function getRoleLabel(role: MemberRole | "owner"): string {
  return roleLabels[role] ?? role;
}
