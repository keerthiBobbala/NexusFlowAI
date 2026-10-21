import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Boxes, Files, Workflow } from 'lucide-react';
import { dashboardApi, workspaceApi } from '../api';
import { queryKeys } from '../utils/queryKeys';
import LoadingState from '../components/LoadingState';
import ErrorBanner from '../components/ErrorBanner';
import WorkflowGraph from '../components/WorkflowGraph';
import StatusPill from '../components/StatusPill';
import { formatDate } from '../utils/format';

function Stat({ label, value, icon: Icon, tone }) {
  return (
    <div className="panel group flex items-center justify-between rounded-2xl p-5 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ${tone}`}>
        <Icon size={22} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.get
  });
  const workspacesQuery = useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: workspaceApi.list
  });

  const dashboard = dashboardQuery.data;
  const workspaces = workspacesQuery.data?.workspaces || [];
  const recentWorkspace = workspaces[0];
  const recentRuns = dashboard?.recentRuns || [];
  const graphState = {
    Planner: dashboard?.workspaceCount > 0,
    Retriever: dashboard?.documentCount > 0,
    Task: dashboard?.runCount > 0,
    Writer: recentRuns.some((run) => run.status === 'completed' && run.output && Object.keys(run.output).length > 0),
    Evaluator: recentRuns.some((run) => run.status === 'completed' && run.evaluation && Object.keys(run.evaluation).length > 0)
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Workspaces" value={dashboard?.workspaceCount ?? 0} icon={Boxes} tone="bg-gradient-to-br from-indigo-500 to-violet-600" />
        <Stat label="Documents" value={dashboard?.documentCount ?? 0} icon={Files} tone="bg-gradient-to-br from-teal-500 to-emerald-600" />
        <Stat label="Runs" value={dashboard?.runCount ?? 0} icon={Workflow} tone="bg-gradient-to-br from-orange-400 to-rose-500" />
      </div>
      <ErrorBanner message={dashboardQuery.error?.response?.data?.message} />
      {dashboardQuery.isLoading ? <LoadingState label="Loading dashboard…" /> : null}
      <WorkflowGraph workspace={recentWorkspace} state={graphState} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel rounded-xl p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">Recent Workspaces</div>
          <div className="space-y-3">
            {(dashboard?.recentWorkspaces || []).length ? dashboard.recentWorkspaces.map((workspace) => (
              <Link key={workspace.id} to={`/workspaces/${workspace.id}`} className="block rounded-lg border border-slate-200 bg-white p-3 hover:border-teal-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-900">{workspace.name}</div>
                  <div style={{ backgroundColor: workspace.color || '#0f766e' }} className="h-3 w-3 rounded-full" />
                </div>
                <div className="mt-1 text-sm text-slate-600">{workspace.description || 'No description'}</div>
              </Link>
            )) : <div className="text-sm text-slate-500">No workspaces yet.</div>}
          </div>
        </div>
        <div className="panel rounded-xl p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">Recent Runs</div>
          <div className="space-y-3">
            {recentRuns.length ? recentRuns.map((run) => (
              <Link key={run.id} to={`/runs/${run.id}`} className="block rounded-lg border border-slate-200 bg-white p-3 hover:border-teal-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-900">{run.title || run.type}</div>
                  <StatusPill status={run.status} />
                </div>
                <div className="mt-1 text-sm text-slate-600">{formatDate(run.createdAt)}</div>
              </Link>
            )) : <div className="text-sm text-slate-500">No workflow runs yet.</div>}
          </div>
        </div>
      </div>
      <div className="panel rounded-xl p-4">
        <div className="mb-3 text-sm font-semibold text-slate-900">File Type Breakdown</div>
        <div className="flex flex-wrap gap-2">
          {dashboard?.fileTypeBreakdown ? Object.entries(dashboard.fileTypeBreakdown).map(([type, count]) => (
            <span key={type} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {type}: {count}
            </span>
          )) : <div className="text-sm text-slate-500">No files yet.</div>}
        </div>
      </div>
    </div>
  );
}
