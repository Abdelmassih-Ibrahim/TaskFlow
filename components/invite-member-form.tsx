'use client';

import { useActionState } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { inviteMemberToProject } from '@/app/actions/members';
import type { WorkspaceActionState } from '@/lib/workspace/validation';

interface InviteMemberFormProps {
  projectId: string;
}

export function InviteMemberForm({ projectId }: InviteMemberFormProps) {
  const [state, formAction, isPending] = useActionState(inviteMemberToProject, {
    status: 'idle',
    message: '',
  } as WorkspaceActionState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <h3 className="mb-4 text-base font-semibold text-slate-900">Bjud in medlemmar</h3>

        {state.status === 'success' && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {state.message}
          </div>
        )}

        {state.status === 'error' && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {state.message}
          </div>
        )}

        <input type="hidden" name="projectId" value={projectId} />

        <div className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              E-postadress
            </label>
            <div className="relative mt-1">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="medlem@exempel.com"
                required
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700">
              Roll
            </label>
            <select
              id="role"
              name="role"
              defaultValue="editor"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="viewer">Betraktare - Kan bara visa</option>
              <option value="editor">Redigerare - Kan redigera uppgifter</option>
              <option value="admin">Admin - Fullständig åtkomst</option>
              <option value="reporter">Rapportörer - Kan bara se rapporter</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Medlemmen kan ändra sin roll senare.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
          <UserPlus size={16} />
          {isPending ? 'Skickar...' : 'Skicka inbjudan'}
        </button>
      </div>
    </form>
  );
}
