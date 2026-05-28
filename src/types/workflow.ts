export type NodeStatus = 'idle' | 'running' | 'success' | 'failed';
export type NodeId = 'input' | 'copywriting' | 'kvPrompt' | 'videoScript';

export type CopyVariant = {
  title: string;
  style: string;
  headline: string;
  body: string;
  cta: string;
  tags: string[];
};

export type KvVariant = {
  title: string;
  concept: string;
  prompt: string;
  negativePrompt: string;
};

export type VideoShot = {
  shot: string;
  duration: string;
  visual: string;
  voiceover: string;
};

export type VideoVariant = {
  title: string;
  rhythm: string;
  totalDuration: string;
  shots: VideoShot[];
};

export type ExtractedInput = {
  raw: string;
  productName: string;
  productCategory: string;
  campaignName: string;
  campaignSummary: string;
  audience: string;
  sellingPoints: string[];
  keywords: string[];
  tone: string;
};

export type WorkflowOutput = {
  input?: ExtractedInput;
  copywriting?: CopyVariant[];
  kvPrompt?: KvVariant[];
  videoScript?: VideoVariant[];
};

export type WorkflowNode = {
  id: NodeId;
  name: string;
  description: string;
  status: NodeStatus;
  error?: string;
  output?: unknown;
  config: {
    enabled: boolean;
    promptTemplate: string;
  };
};

export type WorkflowSnapshot = {
  id: string;
  label: string;
  createdAt: string;
  nodes: WorkflowNode[];
  inputText: string;
  currentNodeId?: NodeId;
};

export type ApiSettings = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};
