'use client';

import { Mail, X } from 'lucide-react';
import type { Invitation } from '@/lib/workspace/types';
import { getRoleLabel } from '@/lib/workspace/permissions';

interface PendingInvitesProps {
  invitations: Invitation[];
  isOwner: boolean;
  onCancelInvite: (invitationId: string) => void;
}

export function PendingInvites({ invitations, isOwner, onCancelInvite }: PendingInvitesProps) {
  const handleCancel = (id: string) => {
    if (!confirm('Avbryt denna inbjudan?')) return;
    onCancelInvite(id);
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Väntande inbjudningar</h3>
      <div className="space-y-2">
        {invitations.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">{invite.email}</p>
                <p className="text-xs text-amber-700">
                  Roll: {getRoleLabel(invite.role)} • Skickad {new Date(invite.created_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => handleCancel(invite.id)}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-100"
              >
                <X size={14} />
                Avbryt
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
