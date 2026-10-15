'use client';

import { useState } from 'react';
import { Check, Clock, Trash2, UserPlus } from 'lucide-react';
import type { ProjectMember, Invitation } from '@/lib/workspace/types';
import { getRoleLabel } from '@/lib/workspace/permissions';

interface MembersListProps {
  projectId: string;
  members: ProjectMember[];
  isOwner: boolean;
  onRemoveMember: (userId: string) => void;
  onChangeRole: (userId: string, newRole: string) => void;
}

export function MembersList({
  projectId,
  members,
  isOwner,
  onRemoveMember,
  onChangeRole,
}: MembersListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRemove = async (userId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna medlem?')) return;
    setLoadingId(userId);
    onRemoveMember(userId);
  };

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <UserPlus size={32} className="mx-auto mb-3 text-slate-400" />
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
            <th className="px-4 py-3 text-left font-semibold text-slate-900">E-post</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Roll</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
            {isOwner && <th className="px-4 py-3 text-right font-semibold text-slate-900">Åtgärd</th>}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-900">{member.userEmail || 'Okänd'}</td>
              <td className="px-4 py-3">
                {isOwner ? (
                  <select
                    value={member.role}
                    onChange={(e) => onChangeRole(member.user_id, e.target.value)}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  >
                    <option value="viewer">Betraktare</option>
                    <option value="editor">Redigerare</option>
                    <option value="admin">Admin</option>
                    <option value="reporter">Rapportörer</option>
                  </select>
                ) : (
                  <span className="text-slate-600">{getRoleLabel(member.role)}</span>
                )}
              </td>
              <td className="px-4 py-3">
                {member.joined_at ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    <Check size={12} />
                    Accepterad
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                    <Clock size={12} />
                    Väntande
                  </span>
                )}
              </td>
              {isOwner && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleRemove(member.user_id)}
                    disabled={loadingId === member.user_id}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                    title="Ta bort medlem"
                  >
                    <Trash2 size={14} />
                    Ta bort
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
