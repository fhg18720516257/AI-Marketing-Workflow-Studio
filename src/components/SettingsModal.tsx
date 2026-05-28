import { X } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

export function SettingsModal() {
  const open = useWorkflowStore((state) => state.settingsOpen);
  const setOpen = useWorkflowStore((state) => state.setSettingsOpen);
  const settings = useWorkflowStore((state) => state.apiSettings);
  const setSettings = useWorkflowStore((state) => state.setApiSettings);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">API Settings</p>
            <h3 className="text-2xl font-black">模型接入配置</h3>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">API Key</span>
            <input value={settings.apiKey} onChange={(e) => setSettings({ apiKey: e.target.value })} type="password" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/40" placeholder="sk-..." />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Base URL</span>
            <input value={settings.baseUrl} onChange={(e) => setSettings({ baseUrl: e.target.value })} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/40" placeholder="https://api.openai.com/v1" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Model Name</span>
            <input value={settings.modelName} onChange={(e) => setSettings({ modelName: e.target.value })} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/40" placeholder="gpt-4o-mini" />
          </label>
          <p className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-100">
            说明：本工作台通过 OpenAI 兼容接口调用大模型。请确保所填服务商支持 <code>POST /chat/completions</code> 和 JSON 输出。
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
