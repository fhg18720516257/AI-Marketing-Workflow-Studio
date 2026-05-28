# 商品与活动信息 AI 营销工作台

面向电商与活动运营的轻量工作流前端：输入商品与活动信息后，自动产出营销文案、KV 视觉提示词与短视频分镜脚本，并支持节点编辑、失败重试、历史回退与 OpenAI 兼容模型接入。

## 功能概览

- **四节点工作流**：信息输入 → 营销文案 → KV 提示词 → 短视频分镜
- **单次 API 加速**：除信息输入为本地提取外，三个 AI 节点合并为 **一次** 流式请求，前端拆成三个板块展示，显著减少等待时间
- **流式输出**：生成过程实时显示 token，便于观察进度
- **节点可配置**：支持修改节点名称、Prompt 模板，或禁用单个节点
- **运行控制**：失败重试、手动跳过、从任意节点重跑
- **历史快照**：自动保存运行结果，最多保留 12 条，可一键回退
- **最终产出面板**：按文案 / KV / 短视频分 Tab 查看，支持复制 JSON

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 状态 | Zustand |
| 图标 | Lucide React |

## 快速开始

### 环境要求

- Node.js 18+
- npm（或 pnpm / yarn）

### 安装与运行

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

开发服务器默认地址：`http://localhost:5173`

### 配置模型 API

1. 启动项目后，点击右上角 **设置**
2. 填写以下信息（保存在浏览器 `localStorage`，不会上传到第三方服务器）：

| 字段 | 说明 | 默认值示例 |
|------|------|------------|
| API Key | 服务商密钥 | — |
| Base URL | OpenAI 兼容接口根地址 | `https://ark.cn-beijing.volces.com/api/v3` |
| Model Name | 模型名称 | `Doubao-Seed-1.6` |

3. 确保服务商支持：
   - `POST {baseUrl}/chat/completions`
   - `stream: true` 流式响应
   - `response_format: { type: "json_object" }` JSON 输出

也可使用 OpenAI、DeepSeek、通义、豆包等任意兼容接口，只需修改 Base URL 与模型名。

## 使用说明

### 基本流程

1. 在 **商品与活动信息** 文本框中输入原始 Brief（商品名、活动、卖点、人群等）
2. 配置好 API 后，点击 **开始工作流**
3. 工作流依次完成：
   - **Input｜信息输入**：本地规则提取结构化 Brief（无 API 调用）
   - **Copywriting / KV Prompt / Video Script**：**一次 API 调用** 生成全部结果，并分别写入三个节点
4. 在 **最终产出** 区域切换 Tab 查看结果

### 节点操作

| 操作 | 方式 |
|------|------|
| 选中节点 | 点击工作流画布上的节点卡片 |
| 编辑 Prompt | 选中节点后在「编辑节点」面板修改并保存 |
| 从节点重跑 | 节点详情中点击「从当前节点重跑」，或双击画布节点 |
| 失败重试 | 节点失败后点击「重试」 |
| 跳过节点 | 失败后点击「手动跳过」，继续后续流程 |
| 恢复历史 | 右侧历史侧栏选择快照 |

> **说明**：从 KV 或短视频节点重跑时，仍会发起一次完整的三合一 API 请求（性能与一致性权衡），但只会更新从该节点起的节点数据；若信息输入节点已有 Brief，会作为上下文传入。

## 工作流架构

```
用户输入文本
      │
      ▼
┌─────────────┐
│ Input 节点   │  本地提取（商品名、类目、活动、卖点、人群等）
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  单次 API 调用（流式 JSON）                    │
│  copywriting + kvPrompt + videoScript       │
└──────┬──────────────┬──────────────┬────────┘
       │              │              │
       ▼              ▼              ▼
   营销文案×3      KV 提示词×3     短视频脚本×3
```

合并后的 JSON 顶层结构示例：

```json
{
  "copywriting": { "versionA": {}, "versionB": {}, "versionC": {} },
  "kvPrompt": { "versionA": {}, "versionB": {}, "versionC": {} },
  "videoScript": { "versionA": {}, "versionB": {}, "versionC": {} }
}
```

## 项目结构

```
├── index.html
├── package.json
├── vite.config.ts
└── src/
    ├── main.tsx              # 入口
    ├── App.tsx               # 页面布局
    ├── types/
    │   └── workflow.ts       # 类型定义
    ├── store/
    │   └── workflowStore.ts  # 工作流状态与编排逻辑
    ├── lib/
    │   └── mockAi.ts         # 本地提取 + API 调用 + 结果归一化
    └── components/
        ├── WorkflowCanvas.tsx   # 节点画布
        ├── NodeCard.tsx         # 当前节点详情
        ├── EditPanel.tsx        # 节点配置编辑
        ├── OutputPanel.tsx      # 最终产出展示
        ├── HistorySidebar.tsx   # 历史快照
        ├── SettingsModal.tsx    # API 设置弹窗
        └── ...
```

## 常见问题

**Q: 提示「API Key 未配置」？**  
在设置中填写 API Key 后重试。

**Q: 提示「模型返回内容不是合法 JSON」？**  
换用支持 JSON 模式的模型，或缩短各节点的 Prompt 模板，减少输出长度。

**Q: 请求超时？**  
合并请求默认超时 120 秒。可换更快模型，或在设置中使用响应更快的接口。

**Q: API Key 存在哪里？**  
仅保存在本机浏览器 `localStorage` 键名 `workflow-api-settings`，请勿在公共设备上保存敏感密钥。

## 开发说明

- 状态管理：`src/store/workflowStore.ts`
- API 与 Prompt：`src/lib/mockAi.ts`
- 修改默认模型：见 `workflowStore.ts` 中的 `defaultSettings`
- 调整单次输出上限：见 `mockAi.ts` 中 `max_tokens`（当前 4096）

## License

本项目为本地工作台示例，按需自行扩展与部署。
