import { CheckCircle2, Pencil, PlayCircle, RotateCcw, SkipForward, XCircle } from 'lucide-react';
import { type ReactNode } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { WorkflowNode } from '../types/workflow';

const iconMap: Record<WorkflowNode['status'], ReactNode> = {
  idle: <PlayCircle className="size-5" />,
  running: <RotateCcw className="size-5 animate-spin" />,
  success: <CheckCircle2 className="size-5" />,
  failed: <XCircle className="size-5" />,
};

export function NodeCard() {
  const node = useWorkflowStore((state) => state.nodes.find((item) => item.id === state.selectedNodeId));
  const retryNode = useWorkflowStore((state) => state.retryNode);
  const skipNode = useWorkflowStore((state) => state.skipNode);
  const rerunFromNode = useWorkflowStore((state) => state.rerunFromNode);
  const selectNode = useWorkflowStore((state) => state.selectNode);

  if (!node) return null;

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Selected Node</p>
          <h3 className="mt-1 text-2xl font-black">{node.name}</h3>
          <p className="mt-2 text-sm text-slate-300">{node.description}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-cyan-200">{iconMap[node.status]}</div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {node.status === 'failed' && (
          <>
            <button onClick={() => void retryNode(node.id)} className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
              <RotateCcw className="size-4" /> 重试
            </button>
            <button onClick={() => void skipNode(node.id)} className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100">
              <SkipForward className="size-4" /> 手动跳过
            </button>
          </>
        )}
        {node.status !== 'running' && (
          <button onClick={() => void rerunFromNode(node.id)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
            <PlayCircle className="size-4" /> 从当前节点重跑
          </button>
        )}
        <button onClick={() => selectNode(node.id)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
          <Pencil className="size-4" /> 选中
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-950/50 p-4">
          <p className="text-xs text-slate-400">状态</p>
          <p className="mt-2 text-lg font-bold capitalize">{node.status}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 p-4 md:col-span-2">
          <p className="text-xs text-slate-400">Prompt 模板</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{node.config.promptTemplate}</p>
        </div>
      </div>

      {node.error && <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">{node.error}</div>}
    </section>
  );
}
