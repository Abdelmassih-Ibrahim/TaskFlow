'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { cancelInvitation, changeMemberRole, removeMember } from '@/app/actions/members';
import { InviteMemberForm } from '@/components/invite-member-form';
import { MembersList } from '@/components/members-list';
import { PendingInvites } from '@/components/pending-invites';
import type { Invitation, ProjectMember } from '@/lib/workspace/types';
import type { WorkspaceActionState } from '@/lib/workspace/validation';

interface ProjectMembersContentProps {
  project: { id: string; name: string };
  ownerId: string;
  members: ProjectMember[];
  invitations: Invitation[];
  isOwner: boolean;
}

const initialState: WorkspaceActionState = { status: 'idle', message: '' };

async function dispatchMemberAction(
  previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const action = formData.get('_action');
  formData.delete('_action');

  if (action === 'changeRole') return changeMemberRole(previousState, formData);
  if (action === 'removeMember') return removeMember(previousState, formData);
  if (action === 'cancelInvite') return cancelInvitation(previousState, formData);
  return previousState;
}

export function ProjectMembersContent({
  project,
  ownerId,
  members,
  invitations,
  isOwner,
}: ProjectMembersContentProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(dispatchMemberAction, initialState);

  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [router, state]);

  const send = (fields: Record<string, string>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.append(key, value);
    formAction(formData);
  };

  const activeMembers = members.filter((member) => member.user_id !== ownerId);
  const ownerMember = members.find((member) => member.user_id === ownerId);

  return (
    <main className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-[1320px] space-y-8">
        <div>
          <Link
            href={`/?projekt=${project.id}#task-overview`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Tillbaka till {project.name}
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <Users size={30} className="text-slate-400" aria-hidden="true" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
                Medlemmar
                <span className="text-indigo-600">.</span>
              </h1>
              <p className="mt-1 text-[15px] text-slate-500">{project.name}</p>
            </div>
          </div>
        </div>

        {state.status === 'success' && (
          <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {state.message}
          </div>
        )}
        {state.status === 'error' && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
            {state.message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {isOwner && (
            <div className="lg:col-span-1">
              <InviteMemberForm projectId={project.id} />
            </div>
          )}

          <div className={isOwner ? 'space-y-6 lg:col-span-2' : 'space-y-6 lg:col-span-3'}>
            <section aria-labelledby="members-heading">
              <h2 id="members-heading" className="mb-4 text-base font-semibold text-slate-900">
                Medlemmar ({members.length})
              </h2>
              <MembersList
                members={ownerMember ? [ownerMember, ...activeMembers] : activeMembers}
                ownerId={ownerId}
                isOwner={isOwner}
                onRemoveMember={(userId) => send({ _action: 'removeMember', projectId: project.id, userId })}
                onChangeRole={(userId, role) =>
                  send({ _action: 'changeRole', projectId: project.id, userId, role })
                }
              />
            </section>

            {isOwner && (
              <PendingInvites
                invitations={invitations}
                onCancelInvite={(invitationId) =>
                  send({ _action: 'cancelInvite', invitationId })
                }
              />
            )}
          </div>
        </div>

        {!isOwner && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Du är medlem i detta projekt. Bara projektets ägare kan hantera medlemmar.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
