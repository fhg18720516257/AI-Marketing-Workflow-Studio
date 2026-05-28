import { Clock3, RotateCcw } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

export function HistorySidebar() {
  const history = useWorkflowStore((state) => state.history);
  const restoreSnapshot = useWorkflowStore((state) => state.restoreSnapshot);

  return (
    <aside className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Time Travel</p>
          <h3 className="text-2xl font-black">历史快照</h3>
        </div>
        <Clock3 className="size-5 text-cyan-200" />
      </div>

      <div className="mt-5 space-y-3">
        {history.length ? (
          history.map((snapshot) => (
            <button
              key={snapshot.id}
              onClick={() => restoreSnapshot(snapshot.id)}
              className="w-full rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-left transition hover:border-cyan-400/30 hover:bg-slate-900/80"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white">{snapshot.label}</p>
                <RotateCcw className="size-4 text-slate-400" />
              </div>
              <p className="mt-2 text-xs text-slate-400">{snapshot.createdAt}</p>
              <p className="mt-3 line-clamp-2 text-sm text-slate-300">{snapshot.inputText}</p>
            </button>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/50 p-5 text-sm text-slate-400">暂无快照。完成一次工作流或修改节点配置后，会自动生成历史记录。</div>
        )}
      </div>
    </aside>
  );
}
