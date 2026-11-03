'use client';

import { Trash2, UserPlus } from 'lucide-react';
import type { ProjectMember } from '@/lib/workspace/types';
import { getRoleLabel } from '@/lib/workspace/permissions';

interface MembersListProps {
  members: ProjectMember[];
  ownerId: string;
  isOwner: boolean;
  onRemoveMember: (userId: string) => void;
  onChangeRole: (userId: string, newRole: string) => void;
}

export function MembersList({
  members,
  ownerId,
  isOwner,
  onRemoveMember,
  onChangeRole,
}: MembersListProps) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <UserPlus size={32} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
        <h3 className="font-semibold text-slate-900">Inga medlemmar ännu</h3>
        <p className="mt-1 text-sm text-slate-600">Bjud in medlemmar för att börja samarbeta.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900">E-post</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900">Roll</th>
            {isOwner && (
              <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-900">Åtgärd</th>
            )}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const isProjectOwner = member.user_id === ownerId;
            return (
              <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-900">{member.user_email ?? 'Okänd e-post'}</td>
                <td className="px-4 py-3">
                  {isOwner && !isProjectOwner ? (
                    <select
                      aria-label={`Roll för ${member.user_email ?? 'medlem'}`}
                      value={member.role}
                      onChange={(e) => onChangeRole(member.user_id, e.target.value)}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                    >
                      <option value="viewer">Betraktare</option>
                      <option value="editor">Redigerare</option>
                      <option value="admin">Admin</option>
                      <option value="reporter">Rapportör</option>
                    </select>
                  ) : (
                    <span className="text-slate-600">
                      {isProjectOwner ? 'Ägare' : getRoleLabel(member.role)}
                    </span>
                  )}
                </td>
                {isOwner && (
                  <td className="px-4 py-3 text-right">
                    {!isProjectOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Ta bort medlemmen från projektet?')) {
                            onRemoveMember(member.user_id);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Ta bort
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
