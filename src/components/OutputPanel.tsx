import { Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { CopyVariant, ExtractedInput, KvVariant, VideoVariant, WorkflowOutput } from '../types/workflow';

const tabs = [
  { id: 'copywriting', label: '文案' },
  { id: 'kvPrompt', label: 'KV 提示词' },
  { id: 'videoScript', label: '短视频脚本' },
] as const;

function collectOutputsFromNodes(nodes: ReturnType<typeof useWorkflowStore.getState>['nodes']): WorkflowOutput {
  const output: WorkflowOutput = {};
  nodes.forEach((node) => {
    if (node.id === 'input' && node.output) output.input = node.output as ExtractedInput;
    if (node.id === 'copywriting' && node.output) output.copywriting = node.output as CopyVariant[];
    if (node.id === 'kvPrompt' && node.output) output.kvPrompt = node.output as KvVariant[];
    if (node.id === 'videoScript' && node.output) output.videoScript = node.output as VideoVariant[];
  });
  return output;
}

export function OutputPanel() {
  const nodes = useWorkflowStore((state) => state.nodes);
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('copywriting');
  const outputs = useMemo(() => collectOutputsFromNodes(nodes), [nodes]);
  const content = outputs[tab];

  const copyToClipboard = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(JSON.stringify(content, null, 2));
  };

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <p className="text-sm text-slate-400">Final Outputs</p>
          <h3 className="text-2xl font-black">最终产出</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-white/10 bg-slate-950/70 p-1">
            {tabs.map((item) => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === item.id ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:text-white'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={copyToClipboard} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
            <Copy className="size-4" /> 复制 JSON
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {Array.isArray(content) ? (
          content.map((item: any, index: number) => (
            <article key={index} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-lg font-bold">{item.title}</h4>
                {'style' in item && <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{item.style ?? item.rhythm}</span>}
              </div>
              {'headline' in item && <p className="mt-3 text-sm text-cyan-100">{item.headline}</p>}
              {'body' in item && <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-300">{item.body}</p>}
              {'cta' in item && <p className="mt-3 text-sm font-semibold text-amber-200">{item.cta}</p>}
              {'concept' in item && <p className="mt-3 text-sm leading-7 text-slate-300">{item.concept}</p>}
              {'prompt' in item && (
                <div className="mt-3 rounded-2xl bg-slate-900/80 p-3 text-xs text-slate-300">
                  <p className="font-semibold text-cyan-100">Prompt</p>
                  <p className="mt-2 whitespace-pre-wrap break-words leading-6">{item.prompt}</p>
                  <p className="mt-3 font-semibold text-rose-200">Negative Prompt</p>
                  <p className="mt-2 whitespace-pre-wrap break-words leading-6">{item.negativePrompt}</p>
                </div>
              )}
              {'shots' in item && Array.isArray(item.shots) && (
                <div className="mt-3 space-y-3">
                  {item.shots.map((shot: any) => (
                    <div key={`${shot.shot}-${shot.duration}`} className="rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-300">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{shot.shot}</span>
                        <span>{shot.duration}</span>
                      </div>
                      <p className="mt-2">画面：{shot.visual}</p>
                      <p className="mt-1 text-cyan-100">旁白：{shot.voiceover}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/50 p-8 text-center text-slate-400">当前节点暂无产出，运行工作流后将在这里展示结果。</div>
        )}
      </div>
    </section>
  );
}
