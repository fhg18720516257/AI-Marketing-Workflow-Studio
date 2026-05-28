import { PlayCircle, Settings, WandSparkles } from 'lucide-react';
import { ApiStatus } from './components/ApiStatus';
import { EditPanel } from './components/EditPanel';
import { HistorySidebar } from './components/HistorySidebar';
import { NodeCard } from './components/NodeCard';
import { OutputPanel } from './components/OutputPanel';
import { SettingsModal } from './components/SettingsModal';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { useWorkflowStore } from './store/workflowStore';

export function App() {
  const inputText = useWorkflowStore((state) => state.inputText);
  const setInputText = useWorkflowStore((state) => state.setInputText);
  const startWorkflow = useWorkflowStore((state) => state.startWorkflow);
  const currentNodeId = useWorkflowStore((state) => state.currentNodeId);
  const setSettingsOpen = useWorkflowStore((state) => state.setSettingsOpen);
  const apiSettings = useWorkflowStore((state) => state.apiSettings);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_30rem),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.25),transparent_24rem),radial-gradient(circle_at_50%_100%,rgba(244,63,94,0.16),transparent_25rem)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-cyan-200">AI Marketing Workflow Studio</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">商品与活动信息 AI 营销工作台</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                输入商品与活动信息后，工作流会通过单次 API 调用一次性生成文案、KV 视觉提示词与短视频分镜，前端拆成三个节点展示，并支持失败重试、任意节点重跑、历史回退、节点编辑与真实模型接入。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full border px-4 py-2 text-xs font-semibold ${apiSettings.apiKey ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : 'border-amber-400/30 bg-amber-400/10 text-amber-100'}`}>
                {apiSettings.apiKey ? `API 已配置｜${apiSettings.modelName}` : 'API 未配置'}
              </span>
              <button onClick={() => setSettingsOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                <Settings className="size-5" /> 设置
              </button>
              <button onClick={startWorkflow} className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.02]">
                <PlayCircle className="size-5" /> 开始工作流
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-5">
            <WorkflowCanvas />
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">Input</p>
                  <h2 className="text-2xl font-black">商品与活动信息</h2>
                </div>
                <WandSparkles className="size-6 text-cyan-200" />
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                className="mt-4 w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-400/40"
              />
              <p className="mt-3 text-xs text-slate-400">提示：修改输入后会自动保存历史快照；点击节点可在右侧编辑节点名称与 Prompt 模板。</p>
              <p className="mt-2 text-xs text-cyan-100">当前状态：{currentNodeId ? `正在运行 ${currentNodeId}` : '空闲 / 已完成'}</p>
            </div>
            <NodeCard />
            <OutputPanel />
            <EditPanel />
          </div>
          <HistorySidebar />
        </section>
      </div>
      <SettingsModal />
    </main>
  );
}
