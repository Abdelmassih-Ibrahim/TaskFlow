'use client';

import { useState } from 'react';
import { Check, Copy, Mail, X } from 'lucide-react';
import type { Invitation } from '@/lib/workspace/types';
import { getRoleLabel } from '@/lib/workspace/permissions';

interface PendingInvitesProps {
  invitations: Invitation[];
  onCancelInvite: (invitationId: string) => void;
}

function InviteLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copyLink}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {copied ? 'Kopierad' : 'Kopiera länk'}
    </button>
  );
}

export function PendingInvites({ invitations, onCancelInvite }: PendingInvitesProps) {
  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Väntande inbjudningar</h3>
      <div className="space-y-2">
        {invitations.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-amber-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-amber-900">{invite.email}</p>
                <p className="text-xs text-amber-800">
                  Roll: {getRoleLabel(invite.role)} · Gäller till{' '}
                  {new Date(invite.expires_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <InviteLinkButton token={invite.token} />
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Avbryt denna inbjudan?')) onCancelInvite(invite.id);
                }}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
              >
                <X size={14} aria-hidden="true" />
                Avbryt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
