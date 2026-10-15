'use client';

import { useActionState, useTransition } from 'react';
import { Users } from 'lucide-react';
import { changeMemberRole, removeMember, cancelInvitation } from '@/app/actions/members';
import { InviteMemberForm } from '@/components/invite-member-form';
import { MembersList } from '@/components/members-list';
import { PendingInvites } from '@/components/pending-invites';
import type { Project, ProjectMember, Invitation } from '@/lib/workspace/types';
import type { WorkspaceActionState } from '@/lib/workspace/validation';

interface ProjectMembersPageProps {
  project: Project & {
    members: ProjectMember[];
    invitations: Invitation[];
  };
  isOwner: boolean;
}

export default function ProjectMembersPage({ project, isOwner }: ProjectMembersPageProps) {
  const [state, formAction] = useActionState(
    async (prevState: WorkspaceActionState, formData: FormData) => {
      const action = formData.get('_action');
      formData.delete('_action');

      if (action === 'changeRole') {
        return await changeMemberRole(prevState, formData);
      } else if (action === 'removeMember') {
        return await removeMember(prevState, formData);
      } else if (action === 'cancelInvite') {
        return await cancelInvitation(prevState, formData);
      }
      return prevState;
    },
    { status: 'idle', message: '' } as WorkspaceActionState,
  );

  const handleRemoveMember = (userId: string) => {
    const formData = new FormData();
    formData.append('_action', 'removeMember');
    formData.append('projectId', project.id);
    formData.append('userId', userId);
    formAction(formData);
  };

  const handleChangeRole = (userId: string, newRole: string) => {
    const formData = new FormData();
    formData.append('_action', 'changeRole');
    formData.append('projectId', project.id);
    formData.append('userId', userId);
    formData.append('role', newRole);
    formAction(formData);
  };

  const handleCancelInvite = (invitationId: string) => {
    const formData = new FormData();
    formData.append('_action', 'cancelInvite');
    formData.append('invitationId', invitationId);
    formAction(formData);
  };

  return (
    <main className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-[1320px] space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <Users size={32} className="text-slate-400" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
                Lagmedlemmar
                <span className="text-teal-600">.</span>
              </h1>
              <p className="mt-1 text-[15px] text-slate-500">{project.name}</p>
            </div>
          </div>
        </div>

        {/* Global message */}
        {state.status === 'success' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">{state.message}</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-700">{state.message}</p>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column: Invite form */}
          {isOwner && (
            <div className="lg:col-span-1">
              <InviteMemberForm projectId={project.id} />
            </div>
          )}

          {/* Right column: Members list */}
          <div className={isOwner ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="space-y-6">
              {/* Active Members */}
              <section>
                <h2 className="mb-4 text-base font-semibold text-slate-900">
                  Medlemmar ({project.members.filter((m) => m.joined_at).length})
                </h2>
                <MembersList
                  projectId={project.id}
                  members={project.members}
                  isOwner={isOwner}
                  onRemoveMember={handleRemoveMember}
                  onChangeRole={handleChangeRole}
                />
              </section>

              {/* Pending Invitations */}
              {project.invitations && project.invitations.length > 0 && (
                <section>
                  <PendingInvites
                    invitations={project.invitations}
                    isOwner={isOwner}
                    onCancelInvite={handleCancelInvite}
                  />
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Info box */}
        {!isOwner && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Du är medlem av detta projekt. Endast projektägaren kan hantera medlemmar.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
