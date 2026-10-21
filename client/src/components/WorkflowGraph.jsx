import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

const nodes = ['Planner', 'Retriever', 'Task', 'Writer', 'Evaluator'];

export default function WorkflowGraph({ workspace, documents = [], runs = [], state }) {
  const activeMap = state || {
    Planner: Boolean(workspace),
    Retriever: documents.some((document) => document.status === 'ready'),
    Task: runs.length > 0,
    Writer: runs.some((run) => run.status === 'completed' && run.output && Object.keys(run.output).length > 0),
    Evaluator: runs.some((run) => run.status === 'completed' && run.evaluation && Object.keys(run.evaluation).length > 0)
  };

  return (
    <div className="panel rounded-xl p-4">
      <div className="mb-3 text-sm font-semibold text-slate-900">Workflow Graph</div>
      <div className="flex flex-wrap items-center gap-3">
        {nodes.map((node, index) => (
          <div key={node} className="flex items-center gap-3">
            <div className={`flex min-w-[110px] items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${activeMap[node] ? 'border-teal-300 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-500'}`}>
              {activeMap[node] ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              {node}
            </div>
            {index < nodes.length - 1 ? <ArrowRight size={16} className="text-slate-400" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
