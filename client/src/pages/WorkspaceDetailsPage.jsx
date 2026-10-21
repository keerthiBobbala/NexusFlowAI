import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { documentApi, runApi, workspaceApi } from '../api';
import { queryKeys } from '../utils/queryKeys';
import LoadingState from '../components/LoadingState';
import ErrorBanner from '../components/ErrorBanner';
import Button from '../components/Button';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import ChatPanel from '../components/ChatPanel';
import WorkflowGraph from '../components/WorkflowGraph';
import { formatDate } from '../utils/format';

function SectionTitle({ children }) {
  return <div className="mb-3 text-sm font-semibold text-slate-900">{children}</div>;
}

export default function WorkspaceDetailsPage() {
  const { workspaceId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [summaryPrompt, setSummaryPrompt] = useState('');
  const [comparePrompt, setComparePrompt] = useState('');
  const [actionPrompt, setActionPrompt] = useState('');
  const [topicPrompt, setTopicPrompt] = useState('');
  const [researchPrompt, setResearchPrompt] = useState('');

  const workspaceQuery = useQuery({
    queryKey: queryKeys.workspaceDetails(workspaceId),
    queryFn: () => workspaceApi.get(workspaceId),
    enabled: Boolean(workspaceId)
  });
  const documentsQuery = useQuery({
    queryKey: queryKeys.workspaceDocuments(workspaceId),
    queryFn: () => documentApi.list(workspaceId),
    enabled: Boolean(workspaceId)
  });
  const runsQuery = useQuery({
    queryKey: queryKeys.workspaceRuns(workspaceId),
    queryFn: () => runApi.list(workspaceId),
    enabled: Boolean(workspaceId)
  });

  const workspace = workspaceQuery.data?.workspace;
  const workspaceStats = workspaceQuery.data?.workspaceStats || { documentCount: 0, readyDocumentCount: 0, runCount: 0 };
  const documents = documentsQuery.data?.documents || [];
  const runs = runsQuery.data?.runs || [];
  const recentRuns = runs.slice(0, 6);

  useEffect(() => {
    setSelectedDocumentIds((current) => current.filter((id) => documents.some((document) => document.id === id)));
  }, [documents]);

  const uploadMutation = useMutation({
    mutationFn: (file) => documentApi.upload(workspaceId, file),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDocuments(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDetails(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaces }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceRuns(workspaceId) })
      ]);
    }
  });

  const reprocessMutation = useMutation({
    mutationFn: documentApi.reprocess,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDocuments(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDetails(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceRuns(workspaceId) })
      ]);
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: documentApi.remove,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDocuments(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDetails(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceRuns(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      ]);
    }
  });

  const summarizeMutation = useMutation({
    mutationFn: (payload) => runApi.summarize(workspaceId, payload),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceRuns(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDetails(workspaceId) })
      ]);
      navigate(`/runs/${data.run.id}`);
    }
  });

  const compareMutation = useMutation({
    mutationFn: (payload) => runApi.compare(workspaceId, payload),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceRuns(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDetails(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      ]);
      navigate(`/runs/${data.run.id}`);
    }
  });

  const actionItemsMutation = useMutation({
    mutationFn: (payload) => runApi.actionItems(workspaceId, payload),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceRuns(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDetails(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      ]);
      navigate(`/runs/${data.run.id}`);
    }
  });

  const researchMutation = useMutation({
    mutationFn: (payload) => runApi.researchBrief(workspaceId, payload),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceRuns(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDetails(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      ]);
      navigate(`/runs/${data.run.id}`);
    }
  });

  const toggleDocument = (documentId) => {
    setSelectedDocumentIds((current) =>
      current.includes(documentId) ? current.filter((id) => id !== documentId) : [...current, documentId]
    );
  };

  const uploadFile = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      event.target.value = '';
    }
  };

  const readyDocuments = documents.filter((document) => document.status === 'ready');
  const graphDocuments = documents;
  const selectedDocs = selectedDocumentIds.length ? selectedDocumentIds : readyDocuments.map((document) => document.id);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <div className="panel rounded-xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-semibold text-slate-950">{workspace?.name || 'Workspace'}</div>
              <div className="mt-1 text-sm text-slate-600">{workspace?.description || 'No description provided.'}</div>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ backgroundColor: workspace?.color || '#0f766e' }} className="h-3 w-3 rounded-full" />
              <span className="text-sm text-slate-600">{workspace ? formatDate(workspace.updatedAt) : ''}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Documents</div>
              <div className="mt-1 text-2xl font-semibold">{workspaceStats.documentCount}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Ready</div>
              <div className="mt-1 text-2xl font-semibold">{workspaceStats.readyDocumentCount}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Runs</div>
              <div className="mt-1 text-2xl font-semibold">{workspaceStats.runCount}</div>
            </div>
          </div>
        </div>

        <WorkflowGraph workspace={workspace} documents={graphDocuments} runs={runs} />

        <div className="panel rounded-xl p-5">
          <SectionTitle>Upload Document</SectionTitle>
          <ErrorBanner
            message={
              uploadMutation.error?.response?.data?.message ||
              (uploadMutation.isError ? 'Could not upload this file. Please try again.' : null)
            }
          />
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,text/plain"
            onChange={uploadFile}
            className="block w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
          <p className="mt-2 text-xs text-slate-500">
            Choose a file saved on this device, such as in Downloads. “Upload from mobile” is an optional Windows file-picker feature.
          </p>
          {uploadMutation.isPending ? <div className="mt-3 text-sm text-slate-600">Uploading and processing...</div> : null}
        </div>

        <div className="panel rounded-xl p-5">
          <SectionTitle>Documents</SectionTitle>
          <ErrorBanner message={documentsQuery.error?.response?.data?.message || reprocessMutation.error?.response?.data?.message || deleteDocumentMutation.error?.response?.data?.message} />
          {documentsQuery.isLoading ? <LoadingState label="Loading documents…" /> : null}
          {!documentsQuery.isLoading && !documents.length ? (
            <EmptyState title="No documents yet" description="Upload files to unlock retrieval and workflow actions." />
          ) : (
            <div className="grid items-stretch gap-3 md:grid-cols-2">
              {documents.map((document) => (
                <article key={document.id} className="flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-h-6 items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-1 shrink-0"
                          checked={selectedDocumentIds.includes(document.id)}
                          onChange={() => toggleDocument(document.id)}
                        />
                        <div className="break-all font-semibold text-slate-950">{document.originalName}</div>
                      </div>
                      <div className="document-summary mt-2 min-h-[3.75rem] text-sm leading-5 text-slate-600">{document.summary || 'No summary yet.'}</div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusPill status={document.status} />
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{document.fileType}</span>
                    </div>
                  </div>
                  {document.processingError ? <div className="mt-2 text-sm text-rose-700">{document.processingError}</div> : null}
                  <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <Button variant="secondary" onClick={() => reprocessMutation.mutate(document.id)}>Reprocess</Button>
                    <Button variant="danger" onClick={() => deleteDocumentMutation.mutate(document.id)}>Delete</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="panel rounded-xl p-5">
          <SectionTitle>Workflow Actions</SectionTitle>
          <ErrorBanner
            message={
              summarizeMutation.error?.response?.data?.message ||
              compareMutation.error?.response?.data?.message ||
              actionItemsMutation.error?.response?.data?.message ||
              researchMutation.error?.response?.data?.message ||
              ([summarizeMutation, compareMutation, actionItemsMutation, researchMutation].some((mutation) => mutation.isError)
                ? 'A workflow could not be completed. Please try again.'
                : null)
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <form className="flex min-h-[18rem] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={(event) => {
              event.preventDefault();
              summarizeMutation.mutate({ prompt: summaryPrompt });
            }}>
              <div className="text-sm font-medium text-slate-900">Summarize Workspace</div>
              <div className="mt-3">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-slate-700">Prompt</div>
                  <textarea
                    rows={3}
                    value={summaryPrompt}
                    onChange={(event) => setSummaryPrompt(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              </div>
              <Button className="mt-auto self-start" type="submit" disabled={summarizeMutation.isPending}>Run Summary</Button>
            </form>

            <form className="flex min-h-[18rem] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={(event) => {
              event.preventDefault();
              compareMutation.mutate({ prompt: comparePrompt, documentIds: selectedDocs });
            }}>
              <div className="text-sm font-medium text-slate-900">Compare Documents</div>
              <div className="mt-2 text-xs text-slate-500">Select at least two documents above.</div>
              <div className="mt-3">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-slate-700">Prompt</div>
                  <textarea
                    rows={3}
                    value={comparePrompt}
                    onChange={(event) => setComparePrompt(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              </div>
              <Button className="mt-auto self-start" type="submit" disabled={compareMutation.isPending || selectedDocs.length < 2}>
                Compare
              </Button>
            </form>

            <form className="flex min-h-[18rem] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={(event) => {
              event.preventDefault();
              actionItemsMutation.mutate({ prompt: actionPrompt, documentIds: selectedDocs });
            }}>
              <div className="text-sm font-medium text-slate-900">Meeting Action Items</div>
              <div className="mt-3">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-slate-700">Prompt</div>
                  <textarea
                    rows={3}
                    value={actionPrompt}
                    onChange={(event) => setActionPrompt(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              </div>
              <Button className="mt-auto self-start" type="submit" disabled={actionItemsMutation.isPending}>Extract Actions</Button>
            </form>

            <form className="flex min-h-[18rem] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={(event) => {
              event.preventDefault();
              researchMutation.mutate({ topic: topicPrompt, prompt: researchPrompt, documentIds: selectedDocs });
            }}>
              <div className="text-sm font-medium text-slate-900">Research Brief</div>
              <div className="mt-3">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-slate-700">Topic</div>
                  <textarea
                    rows={2}
                    value={topicPrompt}
                    onChange={(event) => setTopicPrompt(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              </div>
              <div className="mt-3">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-slate-700">Prompt</div>
                  <textarea
                    rows={3}
                    value={researchPrompt}
                    onChange={(event) => setResearchPrompt(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              </div>
              <Button className="mt-auto self-start" type="submit" disabled={researchMutation.isPending}>Generate Brief</Button>
            </form>
          </div>
        </div>

        <div className="panel rounded-xl p-5">
          <SectionTitle>Recent Runs</SectionTitle>
          {runsQuery.isLoading ? <LoadingState label="Loading runs…" /> : null}
          {!runsQuery.isLoading && !recentRuns.length ? (
            <EmptyState title="No runs yet" description="Use the workflow actions above to generate a run." />
          ) : (
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <Link key={run.id} to={`/runs/${run.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-teal-300">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-950">{run.title || run.type}</div>
                      <div className="mt-1 text-sm text-slate-600">{formatDate(run.createdAt)}</div>
                    </div>
                    <StatusPill status={run.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <ChatPanel workspaceId={workspaceId} />
      </div>
    </div>
  );
}
