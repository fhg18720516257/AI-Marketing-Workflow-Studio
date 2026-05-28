import { create } from 'zustand';
import { generateAllWithApi, generateWithApi } from '../lib/mockAi';
import type { ApiSettings, CopyVariant, ExtractedInput, NodeId, WorkflowNode, WorkflowOutput, WorkflowSnapshot } from '../types/workflow';

const nodeOrder: NodeId[] = ['input', 'copywriting', 'kvPrompt', 'videoScript'];
const aiNodeIds: NodeId[] = ['copywriting', 'kvPrompt', 'videoScript'];

const defaultNodes: WorkflowNode[] = [
  { id: 'input', name: 'Input｜信息输入', description: '接收并结构化商品、活动、人群与核心卖点。', status: 'idle', config: { enabled: true, promptTemplate: '请从用户输入中提取商品名称、商品类目、活动名称、活动摘要、目标人群、卖点关键词与语气风格，并整理为营销 Brief。' } },
  { id: 'copywriting', name: 'Copywriting｜营销文案', description: '生成 3 版不同风格的高转化营销文案。', status: 'idle', config: { enabled: true, promptTemplate: '基于营销 Brief，分别生成种草、高转化、情绪价值三种风格文案，严格 JSON 输出。' } },
  { id: 'kvPrompt', name: 'KV Prompt｜视觉提示词', description: '生成 3 版 Midjourney / Stable Diffusion 英文视觉提示词。', status: 'idle', config: { enabled: true, promptTemplate: '基于商品卖点和文案方向，生成英文 KV 视觉提示词、画面描述和负面词，严格 JSON 输出。' } },
  { id: 'videoScript', name: 'Video Script｜短视频分镜', description: '生成 3 版短视频脚本，包含镜头、画面、旁白、时长。', status: 'idle', config: { enabled: true, promptTemplate: '基于商品信息与选中文案，生成不同投放场景的短视频分镜脚本，严格 JSON 输出。' } },
];

const starterInput = '商品：国潮智能保温杯。活动：天猫 618 焕新季，限时 7 折。卖点：24 小时保温保冷、智能温显、316L 食品级不锈钢、国潮山海纹、防漏便携。目标用户：城市白领、注重品质生活的年轻人、送礼人群。';
const defaultSettings: ApiSettings = { apiKey: '', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', modelName: 'Doubao-Seed-1.6' };

let workflowLock = false;

type WorkflowStore = {
  nodes: WorkflowNode[];
  inputText: string;
  currentNodeId?: NodeId;
  selectedNodeId: NodeId;
  history: WorkflowSnapshot[];
  apiSettings: ApiSettings;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  setApiSettings: (patch: Partial<ApiSettings>) => void;
  loadApiSettings: () => void;
  setInputText: (value: string) => void;
  selectNode: (nodeId: NodeId) => void;
  startWorkflow: () => Promise<void>;
  rerunFromNode: (nodeId: NodeId) => Promise<void>;
  retryNode: (nodeId: NodeId) => Promise<void>;
  skipNode: (nodeId: NodeId) => Promise<void>;
  updateNodeConfig: (nodeId: NodeId, patch: Partial<Pick<WorkflowNode, 'name'> & WorkflowNode['config']>) => void;
  restoreSnapshot: (snapshotId: string) => void;
  saveSnapshot: (label?: string) => void;
  getOutputs: () => WorkflowOutput;
};

const cloneNodes = (nodes: WorkflowNode[]) => nodes.map((node) => ({ ...node, config: { ...node.config } }));
const statusPatch = (nodes: WorkflowNode[], nodeId: NodeId, patch: Partial<WorkflowNode>) => nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node));
const hasRunningNode = (nodes: WorkflowNode[]) => nodes.some((node) => node.status === 'running');

const resetFrom = (nodes: WorkflowNode[], nodeId: NodeId) => {
  const startIndex = nodeOrder.indexOf(nodeId);
  return nodes.map((node) => (nodeOrder.indexOf(node.id) >= startIndex ? { ...node, status: 'idle' as const, error: undefined, output: undefined } : node));
};

const collectOutputs = (nodes: WorkflowNode[]): WorkflowOutput => {
  const output: WorkflowOutput = {};
  nodes.forEach((node) => {
    if (node.id === 'input' && node.output) output.input = node.output as ExtractedInput;
    if (node.id === 'copywriting' && node.output) output.copywriting = node.output as CopyVariant[];
    if (node.id === 'kvPrompt' && node.output) output.kvPrompt = node.output as WorkflowOutput['kvPrompt'];
    if (node.id === 'videoScript' && node.output) output.videoScript = node.output as WorkflowOutput['videoScript'];
  });
  return output;
};

const readSettings = (): ApiSettings => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = window.localStorage.getItem('workflow-api-settings');
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
};

const persistSettings = (settings: ApiSettings) => {
  try {
    window.localStorage.setItem('workflow-api-settings', JSON.stringify(settings));
  } catch {
    // ignore localStorage failure
  }
};

const nodeErrorMessage = (error: unknown) => (error instanceof Error ? error.message : '节点运行失败');

const aiOutputKey = (id: NodeId) => {
  if (id === 'copywriting') return 'copywriting' as const;
  if (id === 'kvPrompt') return 'kvPrompt' as const;
  return 'videoScript' as const;
};

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: cloneNodes(defaultNodes),
  inputText: starterInput,
  selectedNodeId: 'input',
  history: [],
  apiSettings: readSettings(),
  settingsOpen: false,

  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setApiSettings: (patch) => {
    const next = { ...get().apiSettings, ...patch };
    set({ apiSettings: next });
    persistSettings(next);
  },
  loadApiSettings: () => set({ apiSettings: readSettings() }),
  setInputText: (value) => set({ inputText: value }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  getOutputs: () => collectOutputs(get().nodes),

  startWorkflow: async () => {
    if (workflowLock || hasRunningNode(get().nodes)) return;
    await get().rerunFromNode('input');
  },

  rerunFromNode: async (nodeId) => {
    const currentNodes = get().nodes;
    const target = currentNodes.find((node) => node.id === nodeId);
    if (!target || target.status === 'running' || hasRunningNode(currentNodes) || workflowLock) return;

    workflowLock = true;
    set({ nodes: resetFrom(currentNodes, nodeId) });

    try {
      const startIndex = nodeOrder.indexOf(nodeId);
      const inputIndex = nodeOrder.indexOf('input');

      if (startIndex <= inputIndex) {
        const inputNode = get().nodes.find((node) => node.id === 'input');
        if (inputNode && !inputNode.config.enabled) {
          set({ nodes: statusPatch(get().nodes, 'input', { status: 'success', error: undefined, output: undefined }) });
        } else if (inputNode) {
          set({ currentNodeId: 'input', selectedNodeId: 'input', nodes: statusPatch(get().nodes, 'input', { status: 'running', error: undefined, output: '正在提取商品与活动信息...' }) });
          try {
            const extracted = await generateWithApi('input', {
              inputText: get().inputText,
              template: inputNode.config.promptTemplate,
              settings: get().apiSettings,
              onToken: (text) => set({ nodes: statusPatch(get().nodes, 'input', { output: text }) }),
            });
            set({ nodes: statusPatch(get().nodes, 'input', { status: 'success', output: extracted, error: undefined }) });
          } catch (error) {
            set({ currentNodeId: undefined, nodes: statusPatch(get().nodes, 'input', { status: 'failed', error: nodeErrorMessage(error) }) });
            return;
          }
        }
      }

      const aiStartIndex = Math.max(startIndex, nodeOrder.indexOf('copywriting'));
      const aiToRun = nodeOrder.slice(aiStartIndex).filter((id): id is NodeId => aiNodeIds.includes(id)).filter((id) => get().nodes.find((node) => node.id === id)?.config.enabled);

      nodeOrder.slice(aiStartIndex).forEach((id) => {
        if (!aiNodeIds.includes(id)) return;
        const node = get().nodes.find((item) => item.id === id);
        if (node && !node.config.enabled) {
          set({ nodes: statusPatch(get().nodes, id, { status: 'success', error: undefined, output: undefined }) });
        }
      });

      if (aiToRun.length === 0) {
        set({ currentNodeId: undefined });
        get().saveSnapshot('完整运行完成');
        return;
      }

      const outputs = collectOutputs(get().nodes);
      let brief = outputs.input;
      if (!brief) {
        try {
          brief = (await generateWithApi('input', { inputText: get().inputText, template: '', settings: get().apiSettings })) as ExtractedInput;
        } catch (error) {
          const message = nodeErrorMessage(error);
          set({
            currentNodeId: undefined,
            nodes: aiToRun.reduce((nodes, id) => statusPatch(nodes, id, { status: 'failed', error: message }), get().nodes),
          });
          return;
        }
      }
      if (!brief) {
        const message = '缺少营销 Brief，请先完成信息输入节点。';
        set({
          currentNodeId: undefined,
          nodes: aiToRun.reduce((nodes, id) => statusPatch(nodes, id, { status: 'failed', error: message }), get().nodes),
        });
        return;
      }

      let nodes = get().nodes;
      for (const id of aiToRun) {
        nodes = statusPatch(nodes, id, { status: 'running', error: undefined, output: '正在一次性生成文案、KV 与短视频脚本...' });
      }
      set({ currentNodeId: aiToRun[0], selectedNodeId: aiToRun[0], nodes });

      try {
        const templateNodes = get().nodes;
        const result = await generateAllWithApi({
          inputText: get().inputText,
          input: brief,
          copywriting: outputs.copywriting,
          templates: {
            copywriting: templateNodes.find((node) => node.id === 'copywriting')?.config.promptTemplate ?? '',
            kvPrompt: templateNodes.find((node) => node.id === 'kvPrompt')?.config.promptTemplate ?? '',
            videoScript: templateNodes.find((node) => node.id === 'videoScript')?.config.promptTemplate ?? '',
          },
          settings: get().apiSettings,
          onToken: (text) => set({ nodes: statusPatch(get().nodes, aiToRun[0], { output: text }) }),
        });

        let updated = get().nodes;
        for (const id of aiToRun) {
          updated = statusPatch(updated, id, { status: 'success', output: result[aiOutputKey(id)], error: undefined });
        }
        set({ nodes: updated, currentNodeId: undefined });
      } catch (error) {
        const message = nodeErrorMessage(error);
        set({
          currentNodeId: undefined,
          nodes: aiToRun.reduce((nodes, id) => statusPatch(nodes, id, { status: 'failed', error: message }), get().nodes),
        });
        return;
      }

      get().saveSnapshot('完整运行完成');
    } finally {
      workflowLock = false;
      if (!hasRunningNode(get().nodes)) set({ currentNodeId: undefined });
    }
  },

  retryNode: async (nodeId) => {
    if (workflowLock || hasRunningNode(get().nodes)) return;
    await get().rerunFromNode(nodeId);
  },

  skipNode: async (nodeId) => {
    if (workflowLock || hasRunningNode(get().nodes)) return;
    set({ nodes: statusPatch(get().nodes, nodeId, { status: 'success', error: undefined }) });
    const nextNode = nodeOrder[nodeOrder.indexOf(nodeId) + 1];
    if (nextNode) await get().rerunFromNode(nextNode);
    else get().saveSnapshot('手动跳过后完成');
  },

  updateNodeConfig: (nodeId, patch) => {
    if (hasRunningNode(get().nodes)) return;
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, name: patch.name ?? node.name, config: { ...node.config, enabled: patch.enabled ?? node.config.enabled, promptTemplate: patch.promptTemplate ?? node.config.promptTemplate } } : node,
      ),
    });
    get().saveSnapshot('手动修改配置');
  },

  restoreSnapshot: (snapshotId) => {
    if (workflowLock || hasRunningNode(get().nodes)) return;
    const snapshot = get().history.find((item) => item.id === snapshotId);
    if (!snapshot) return;
    set({ nodes: cloneNodes(snapshot.nodes), inputText: snapshot.inputText, currentNodeId: snapshot.currentNodeId, selectedNodeId: snapshot.nodes[0]?.id ?? 'input' });
  },

  saveSnapshot: (label = '历史快照') => {
    const snapshot: WorkflowSnapshot = { id: `${Date.now()}-${Math.random()}`, label, createdAt: new Date().toLocaleString('zh-CN', { hour12: false }), nodes: cloneNodes(get().nodes), inputText: get().inputText, currentNodeId: get().currentNodeId };
    set({ history: [snapshot, ...get().history].slice(0, 12) });
  },
}));

export { nodeOrder };
