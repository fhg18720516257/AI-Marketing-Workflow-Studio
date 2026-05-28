import { useEffect, useState } from 'react';
import { PencilLine, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

export function EditPanel() {
  const selectedNode = useWorkflowStore((state) => state.nodes.find((item) => item.id === state.selectedNodeId));
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);
  const [open, setOpen] = useState(true);
  const [name, setName] = useState(selectedNode?.name ?? '');
  const [template, setTemplate] = useState(selectedNode?.config.promptTemplate ?? '');
  const [enabled, setEnabled] = useState(selectedNode?.config.enabled ?? true);

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.name);
      setTemplate(selectedNode.config.promptTemplate);
      setEnabled(selectedNode.config.enabled);
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Config Mode</p>
          <h3 className="text-2xl font-black">编辑节点</h3>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
          {open ? '收起' : '展开'}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">禁用节点</p>
              <p className="text-xs text-slate-400">关闭后该节点会自动跳过。</p>
            </div>
            <button onClick={() => setEnabled((v) => !v)} className="text-cyan-200">
              {enabled ? <ToggleRight className="size-7" /> : <ToggleLeft className="size-7 text-slate-500" />}
            </button>
          </div>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">节点名称</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400/50" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Prompt 模板</span>
            <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={7} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400/50" />
          </label>
          <div className="flex gap-3">
            <button onClick={() => updateNodeConfig(selectedNode.id, { name, enabled, promptTemplate: template })} className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
              <Save className="size-4" /> 保存
            </button>
            <button onClick={() => setTemplate(selectedNode.config.promptTemplate)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
              <PencilLine className="size-4" /> 重置
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
