import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { documentApi, runApi } from '../api';
import { queryKeys } from '../utils/queryKeys';
import LoadingState from '../components/LoadingState';
import ErrorBanner from '../components/ErrorBanner';
import StatusPill from '../components/StatusPill';
import CitationList from '../components/CitationList';
import RunTrace from '../components/RunTrace';
import { formatDate } from '../utils/format';
import { renderInput, renderOutput, renderEvaluation } from '../components/RunDataView';

export default function RunDetailsPage() {
  const { runId } = useParams();
  const runQuery = useQuery({
    queryKey: queryKeys.run(runId),
    queryFn: () => runApi.get(runId),
    enabled: Boolean(runId)
  });
  const workspaceDocumentsQuery = useQuery({
    queryKey: queryKeys.workspaceDocuments(runQuery.data?.run?.workspaceId || ''),
    queryFn: () => documentApi.list(runQuery.data?.run?.workspaceId || ''),
    enabled: Boolean(runQuery.data?.run?.workspaceId)
  });

  const run = runQuery.data?.run;
  const documentNameMap = new Map((workspaceDocumentsQuery.data?.documents || []).map((document) => [document.id, document.originalName]));

  return (
    <div className="space-y-6">
      <ErrorBanner message={runQuery.error?.response?.data?.message} />
      {runQuery.isLoading ? <LoadingState label="Loading run…" /> : null}
      {run ? (
        <>
          <div className="panel rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold text-slate-950">{run.title || run.type}</div>
                <div className="mt-1 text-sm text-slate-600">{formatDate(run.createdAt)}</div>
              </div>
              <StatusPill status={run.status} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {renderInput(run, documentNameMap)}
              {renderEvaluation(run)}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {renderOutput(run)}
            <div className="panel rounded-xl p-5">
              <div className="mb-3 text-sm font-semibold text-slate-900">Citations</div>
              <CitationList citations={run.citations || []} />
            </div>
          </div>

          <div className="panel rounded-xl p-5">
            <div className="mb-3 text-sm font-semibold text-slate-900">Execution Trace</div>
            <RunTrace trace={run.trace || []} />
          </div>
        </>
      ) : null}
    </div>
  );
}
