import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderKanban } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { workspaceApi } from '../api';
import { queryKeys } from '../utils/queryKeys';
import Button from '../components/Button';
import Field from '../components/Field';
import LoadingState from '../components/LoadingState';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import { formatDate } from '../utils/format';

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState('');
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', description: '', color: '#0f766e' }
  });

  const workspacesQuery = useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: workspaceApi.list
  });

  useEffect(() => {
    if (editingId) {
      const workspace = workspacesQuery.data?.workspaces?.find((item) => item.id === editingId);
      if (workspace) {
        reset({
          name: workspace.name,
          description: workspace.description || '',
          color: workspace.color || '#0f766e'
        });
      }
    }
  }, [editingId, reset, workspacesQuery.data]);

  const createMutation = useMutation({
    mutationFn: workspaceApi.create,
    onSuccess: async () => {
      reset({ name: '', description: '', color: '#0f766e' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => workspaceApi.update(id, payload),
    onSuccess: async () => {
      setEditingId('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: workspaceApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    }
  });

  const workspaces = workspacesQuery.data?.workspaces || [];

  return (
    <div className="space-y-6">
      <div className="panel rounded-2xl p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white shadow-md">
            <FolderKanban size={19} />
          </span>
          <div>
            <div className="text-lg font-semibold text-slate-950">{editingId ? 'Edit Workspace' : 'Create Workspace'}</div>
            <div className="mt-0.5 text-sm text-slate-500">Keep documents and workflows organized by project.</div>
          </div>
        </div>
        <form
          className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[1.15fr_1.6fr_0.7fr_auto]"
          onSubmit={handleSubmit((values) => {
            if (editingId) {
              updateMutation.mutate({ id: editingId, payload: values });
            } else {
              createMutation.mutate(values);
            }
          })}
        >
          <Field label="Name" {...register('name', { required: true })} />
          <Field label="Description" {...register('description')} />
          <Field label="Accent color" type="color" className="workspace-color-field" {...register('color')} />
          <div className="flex items-end gap-2">
            <Button className="min-h-10 w-full whitespace-nowrap" type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving…' : editingId ? 'Save Changes' : 'Create Workspace'}
            </Button>
            {editingId ? (
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setEditingId('');
                  reset({ name: '', description: '', color: '#0f766e' });
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </div>

      <ErrorBanner
        message={
          workspacesQuery.error?.response?.data?.message ||
          createMutation.error?.response?.data?.message ||
          updateMutation.error?.response?.data?.message ||
          deleteMutation.error?.response?.data?.message ||
          (workspacesQuery.isError ? 'Could not load workspaces. Please try again.' : null) ||
          (createMutation.isError ? 'Could not create the workspace. Please try again.' : null)
        }
      />
      {workspacesQuery.isLoading ? <LoadingState label="Loading workspaces…" /> : null}

      {!workspacesQuery.isLoading && !workspaces.length ? (
        <EmptyState title="No workspaces yet" description="Create one to start uploading documents and running workflows." />
      ) : (
        <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <article key={workspace.id} className="workspace-card panel flex h-full min-h-60 flex-col rounded-2xl p-5 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <FolderKanban size={20} style={{ color: workspace.color || '#0f766e' }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="workspace-title min-h-7 break-words text-lg font-semibold text-slate-950">{workspace.name}</div>
                  <div className="workspace-description mt-1 min-h-[3.75rem] text-sm leading-5 text-slate-600">
                    {workspace.description || 'No description provided.'}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex min-h-8 flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-slate-100 px-2.5 py-1.5">Updated {formatDate(workspace.updatedAt)}</span>
                <StatusPill status="ready" />
              </div>
              <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Link to={`/workspaces/${workspace.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  Open Workspace <ArrowUpRight size={15} />
                </Link>
                <Button variant="secondary" onClick={() => setEditingId(workspace.id)}>Edit</Button>
                <Button variant="danger" onClick={() => deleteMutation.mutate(workspace.id)}>Delete</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
