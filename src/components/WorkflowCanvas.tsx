import { ArrowDown, Play } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import type { WorkflowNode } from '../types/workflow';

const statusClasses: Record<WorkflowNode['status'], string> = {
  idle: 'border-white/10 bg-white/[0.03] text-slate-300',
  running: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100 shadow-cyan-500/20',
  success: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  failed: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
};

const statusLabel: Record<WorkflowNode['status'], string> = {
  idle: '等待',
  running: '运行中',
  success: '成功',
  failed: '失败',
};

export function WorkflowCanvas() {
  const nodes = useWorkflowStore((state) => state.nodes);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const rerunFromNode = useWorkflowStore((state) => state.rerunFromNode);
  const currentNodeId = useWorkflowStore((state) => state.currentNodeId);

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Workflow Canvas</p>
          <h2 className="text-2xl font-black tracking-tight">商品与活动信息 AI 营销工作流</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">4 Nodes</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4 lg:gap-3">
        {nodes.map((node, index) => (
          <div key={node.id} className="relative">
            <button
              type="button"
              onClick={() => selectNode(node.id)}
              onDoubleClick={() => {
                if (node.status !== 'running') void rerunFromNode(node.id);
              }}
              className={`w-full rounded-3xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-xl ${statusClasses[node.status]} ${currentNodeId === node.id ? 'ring-2 ring-cyan-300/40' : ''}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">Node {index + 1}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em]">{statusLabel[node.status]}</div>
              </div>
              <h3 className="text-lg font-bold">{node.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{node.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>{node.config.enabled ? '启用中' : '已禁用'}</span>
                <span>{node.status === 'running' ? 'Processing...' : 'Ready'}</span>
              </div>
            </button>

            {index < nodes.length - 1 && (
              <div className="hidden lg:flex absolute -right-2 top-1/2 z-10 size-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-cyan-200 shadow-lg">
                <ArrowDown className="size-4 rotate-[-90deg]" />
              </div>
            )}
            {node.status === 'running' && (
              <div className="pointer-events-none absolute inset-x-4 bottom-3 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400" />
              </div>
            )}
            {node.status === 'failed' && (
              <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-rose-500/20 p-2 text-rose-100">
                <Play className="size-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
