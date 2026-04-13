# Custom Analysis Purpose Design

**Date:** 2026-04-13
**Status:** Approved
**Project:** Anything Analyzer (anything-register)

## Goal

Allow users to select a predefined analysis scenario or provide custom analysis instructions before triggering AI analysis, instead of always using the hardcoded default analysis requirements.

## Current Behavior

The `PromptBuilder.build()` method produces a fixed system prompt ("you are a protocol analysis expert") and a fixed set of 8 analysis requirements (scene identification, interaction flow, API endpoints, auth mechanism, streaming, storage, dependencies, reproduction). There is no way for users to customize what the AI focuses on.

## Predefined Scenarios

| ID | Label | Description |
|----|-------|-------------|
| `auto` | 自动识别 (默认) | Current behavior — AI auto-detects and produces a general analysis |
| `reverse-api` | 逆向 API 协议 | Focus on API endpoints, request/response schemas, auth flow, data models, reproduction code |
| `security-audit` | 安全审计 | Focus on auth vulnerabilities, sensitive data exposure, CSRF/XSS risks, insecure headers |
| `performance` | 性能分析 | Focus on request latency, redundant requests, resource loading order, caching |
| `custom` | 自定义... | User provides free-text instructions |

## Data Pipeline

A new optional `purpose?: string` parameter threads through the entire call chain:

```
ControlBar(purpose) → App.handleAnalyze(purpose)
  → useCapture.startAnalysis(sid, purpose)
    → electronAPI.startAnalysis(sid, purpose)
      → IPC "ai:analyze" handler(sid, purpose)
        → AiAnalyzer.analyze(sid, config, onProgress, purpose)
          → PromptBuilder.build(data, platformName, purpose)
```

When `purpose` is `undefined`, empty, or `"auto"`, the existing prompt is used unchanged.

## PromptBuilder Changes

File: `src/main/ai/prompt-builder.ts`

The `build()` method signature changes to:

```typescript
build(data: AssembledData, platformName: string, purpose?: string): PromptMessages
```

Behavior by purpose value:

- **`undefined` / `""` / `"auto"`**: Use existing hardcoded system prompt and 8 analysis requirements. Full backward compatibility.
- **`"reverse-api"`**: Replace `## 分析要求` section with:
  ```
  1. 完整 API 端点清单：列出所有 API 的方法、路径、请求参数、响应 JSON 结构
  2. 鉴权流程：Token/Cookie 获取、刷新、传递机制的完整链路
  3. 请求依赖链：哪些请求的响应是后续请求的必要输入
  4. 数据模型推断：从 API 响应结构推断后端数据模型
  5. 复现代码：用 Python requests 库写出可直接运行的完整 API 调用流程
  ```
- **`"security-audit"`**: Replace `## 分析要求` section with:
  ```
  1. 认证安全：分析认证方式的安全性，是否存在弱口令、明文传输、Token 泄露风险
  2. 敏感数据暴露：检查响应中是否包含不必要的敏感信息（密码、密钥、PII）
  3. CSRF/XSS 风险：分析请求是否缺少 CSRF Token，响应头是否缺少安全头（CSP, X-Frame-Options 等）
  4. 权限控制：分析是否存在越权访问的可能（水平/垂直越权）
  5. 安全建议：针对发现的问题给出具体修复建议
  ```
- **`"performance"`**: Replace `## 分析要求` section with:
  ```
  1. 请求时序分析：分析请求的串行/并行关系，识别阻塞链路
  2. 冗余请求：识别重复或不必要的请求
  3. 资源优化：分析资源加载顺序，识别可优化的静态资源
  4. 缓存策略：分析 Cache-Control、ETag 等缓存头的使用情况
  5. 性能建议：给出具体的性能优化建议和预期收益
  ```
- **Any other string (custom)**: Append user's text as additional instructions to the system prompt, keep the default 8 analysis requirements as baseline context, and prepend the user's custom purpose to the `## 分析要求` section:
  ```
  ## 分析要求
  用户指定的分析重点：{custom text}

  在完成上述重点分析的同时，也请覆盖以下基础分析：
  1. 场景识别：...
  ...（原有 8 项）
  ```

## UI Changes

### ControlBar

File: `src/renderer/components/ControlBar.tsx`

Add a `Select` component next to the Analyze button:

```tsx
<Select
  value={analysisPurpose}
  onChange={setAnalysisPurpose}
  style={{ width: 160 }}
  options={[
    { label: '自动识别', value: 'auto' },
    { label: '逆向 API 协议', value: 'reverse-api' },
    { label: '安全审计', value: 'security-audit' },
    { label: '性能分析', value: 'performance' },
    { label: '自定义...', value: 'custom' }
  ]}
/>
```

When "自定义..." is selected, show an `Input.TextArea` modal or inline input for free-text entry.

The selected purpose is passed via `onAnalyze(purpose)` callback.

### ReportView

File: `src/renderer/components/ReportView.tsx`

The "Re-analyze" button also needs access to the purpose selector. Pass the current purpose from ControlBar state down through App.tsx.

## IPC and Preload Changes

### Preload

File: `src/preload/index.ts`

```typescript
startAnalysis: (sessionId: string, purpose?: string) =>
  ipcRenderer.invoke("ai:analyze", sessionId, purpose),
```

### IPC Handler

File: `src/main/ipc.ts`

```typescript
ipcMain.handle("ai:analyze", async (_event, sessionId: string, purpose?: string) => {
  // ... existing config loading ...
  return aiAnalyzer.analyze(sessionId, config, onProgress, purpose);
});
```

## AiAnalyzer Changes

File: `src/main/ai/ai-analyzer.ts`

```typescript
async analyze(
  sessionId: string,
  config: LLMProviderConfig,
  onProgress?: (chunk: string) => void,
  purpose?: string
): Promise<AnalysisReport> {
  // ... existing code ...
  const { system, user } = promptBuilder.build(data, platformName, purpose)
  // ... rest unchanged ...
}
```

## File Change Summary

| File | Action | Scope |
|------|--------|-------|
| `src/shared/types.ts` | Modify | Add `ANALYSIS_PURPOSES` constant array for UI options |
| `src/main/ai/prompt-builder.ts` | Modify | Accept `purpose?`, conditional analysis requirements |
| `src/main/ai/ai-analyzer.ts` | Modify | Thread `purpose?` parameter |
| `src/main/ipc.ts` | Modify | Thread `purpose?` in IPC handler |
| `src/preload/index.ts` | Modify | Add `purpose?` to bridge |
| `src/renderer/hooks/useCapture.ts` | Modify | Thread `purpose?` in `startAnalysis` |
| `src/renderer/App.tsx` | Modify | Manage purpose state, thread to handlers |
| `src/renderer/components/ControlBar.tsx` | Modify | Add purpose selector UI |
| `src/renderer/components/ReportView.tsx` | Modify | Support purpose for re-analyze |
| `tests/main/ai/prompt-builder.test.ts` | Create | Test purpose-based prompt generation |

## Unchanged

- `DataAssembler`, `SceneDetector`, `LLMRouter` — no changes
- Database schema — analysis purpose is not persisted
- Streaming mechanism — unchanged
