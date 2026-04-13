# OpenAI Responses API Support Design

**Date:** 2026-04-13
**Status:** Approved
**Project:** Anything Analyzer (anything-register)

## Goal

Add OpenAI Responses API (`POST /responses`) support alongside the existing Completions API (`POST /chat/completions`), with a user-selectable API type in the settings UI.

## Background

The current `LLMRouter` supports two code paths:
- **OpenAI/Custom**: `POST {baseUrl}/chat/completions` with `messages` array
- **Anthropic**: `POST {baseUrl}/messages` with extracted `system` field

OpenAI's Responses API is a newer endpoint with a different request/response format. Some users and third-party providers may prefer or require this API type.

## Constraints

- Backward compatible: existing saved `llm-config.json` without `apiType` field must continue to work (defaults to `completions`)
- No changes to `AiAnalyzer`, `DataAssembler`, `PromptBuilder`, `SceneDetector`
- No changes to IPC channels, preload bridge, or database schema
- The `ChatMessage[]` format produced by `PromptBuilder` remains unchanged; `LLMRouter` handles format conversion

## Type Changes

File: `src/shared/types.ts` (lines 118-128)

Add new type and extend config:

```typescript
export type OpenAIApiType = 'completions' | 'responses';

export interface LLMProviderConfig {
  name: LLMProviderType;
  apiType?: OpenAIApiType;   // Only relevant for openai/custom; defaults to 'completions'
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
}
```

The `apiType` field is optional. When absent or `'completions'`, existing behavior is preserved.

## LLMRouter Changes

File: `src/main/ai/llm-router.ts`

### Routing Logic

Current `complete()` method (line 23-28):

```typescript
async complete(messages, onChunk) {
  if (config.name === 'anthropic') return completeAnthropic(messages, onChunk)
  return completeOpenAI(messages, onChunk)
}
```

Updated routing:

```typescript
async complete(messages, onChunk) {
  if (config.name === 'anthropic') return completeAnthropic(messages, onChunk)
  if (config.apiType === 'responses') return completeResponses(messages, onChunk)
  return completeOpenAI(messages, onChunk)
}
```

### New Method: `completeResponses()`

**URL**: `${baseUrl.replace(/\/$/, '')}/responses`

**Headers**: Same as Completions (`Content-Type: application/json`, `Authorization: Bearer {apiKey}`)

**Request Body Construction** (from `ChatMessage[]`):

1. Extract system message → `instructions` field (string)
2. Non-system messages → `input` array with `{role, content}` objects (Responses API accepts this format)
3. `max_tokens` → `max_output_tokens`
4. `stream` parameter: same boolean logic as Completions

```json
{
  "model": "gpt-4o",
  "instructions": "You are a protocol analysis expert...",
  "input": [
    {"role": "user", "content": "Analyze the following..."}
  ],
  "max_output_tokens": 4096,
  "stream": true
}
```

### Non-Streaming Response Parsing

```json
{
  "output_text": "# Analysis Report\n...",
  "usage": {
    "input_tokens": 1234,
    "output_tokens": 5678
  }
}
```

Extract: `response.output_text` for content, `response.usage.input_tokens` / `output_tokens` for token counts.

### Streaming Response Parsing

The Responses API streams SSE events with `event:` and `data:` lines. Key events:

| Event Type | Content | Action |
|------------|---------|--------|
| `response.output_text.delta` | `{"delta": "text chunk"}` | Append to content, call `onChunk(delta)` |
| `response.completed` | Full response with `usage` | Extract token counts |
| `response.failed` | Error info | Throw error |

SSE format differs slightly from Completions:
- Lines are `event: <type>\ndata: <json>\n\n` (has explicit `event:` prefix)
- No `data: [DONE]` sentinel — stream ends with `response.completed` event

### New Method: `parseResponsesStream()`

Similar structure to `parseOpenAIStream()` but:
1. Track current `event:` type alongside `data:` lines
2. On `response.output_text.delta` event: extract `parsed.delta`, call `onChunk()`
3. On `response.completed` event: extract `parsed.response.usage` for token counts
4. Reuses existing `fetchWithRetry()` — no changes needed there

## SettingsModal UI Changes

File: `src/renderer/components/SettingsModal.tsx`

Add an "API Type" form field between "Provider" and "Base URL":

```tsx
<Form.Item
  name="apiType"
  label="API Type"
  rules={[{ required: true }]}
>
  <Select options={[
    { label: 'Chat Completions (/chat/completions)', value: 'completions' },
    { label: 'Responses (/responses)', value: 'responses' }
  ]} />
</Form.Item>
```

**Visibility**: Show only when `name` is `'openai'` or `'custom'`. Hide when `'anthropic'`.

**Default**: `'completions'` (set in `initialValues`).

**Provider change handler**: When switching to `'anthropic'`, clear `apiType`. When switching to `'openai'`/`'custom'`, set `apiType` to `'completions'` if not already set.

## File Change Summary

| File | Action | Scope |
|------|--------|-------|
| `src/shared/types.ts` | Modify (lines 118-128) | Add `OpenAIApiType`, add `apiType?` to `LLMProviderConfig` |
| `src/main/ai/llm-router.ts` | Modify | Add `completeResponses()`, `parseResponsesStream()`, update routing |
| `src/renderer/components/SettingsModal.tsx` | Modify | Add conditional API Type selector |

## Unchanged Files

- `src/main/ai/ai-analyzer.ts` — orchestrator, no API awareness
- `src/main/ai/data-assembler.ts` — data preparation
- `src/main/ai/prompt-builder.ts` — produces `ChatMessage[]`, unaware of API type
- `src/main/ai/scene-detector.ts` — rule-based pre-analysis
- `src/main/ipc.ts` — loads config and delegates, no API-type-specific logic
- `src/preload/index.ts` — IPC bridge
- Database schema — no new columns needed
