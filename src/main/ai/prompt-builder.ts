import type { AssembledData, SceneHint, AuthChainItem, FilteredRequest } from '@shared/types'

interface PromptMessages { system: string; user: string }

/**
 * PromptBuilder — Builds the analysis prompt from assembled data.
 */
export class PromptBuilder {
  build(data: AssembledData, platformName: string): PromptMessages {
    const system = `你是一位网站协议分析专家。你的任务是分析用户在网站上的操作过程中产生的HTTP请求、JS调用和存储变化，识别其业务场景，并生成结构化的协议分析报告。Be precise and technical. Output in Chinese (Simplified).`

    const requestsSection = this.formatRequests(data.requests)
    const hooksSection = this.formatHooks(data.requests)
    const storageSection = this.formatStorageDiff(data.storageDiff)
    const sceneSection = this.formatSceneHints(data.sceneHints)
    const authSection = this.formatAuthChain(data.authChain)
    const streamingSection = this.formatStreamingRequests(data.streamingRequests)

    const user = `以下是用户在 ${platformName} 上操作时的完整数据。

## 场景线索
${sceneSection}

## 鉴权链
${authSection}

## 流式通信
${streamingSection}

## 请求日志
${requestsSection}

## JS Hook 数据
${hooksSection}

## 存储变化
${storageSection}

## 分析要求
1. 场景识别：判断用户执行了什么操作（注册、登录、AI对话、支付等）
2. 交互流程概述：按时间顺序描述完整交互链路
3. API端点清单：列出所有关键API，标注方法、路径、用途
4. 鉴权机制分析：认证方式、凭据获取流程、凭据传递方式
5. 流式通信分析（如检测到SSE/WebSocket）：协议类型、端点、请求/响应格式
6. 存储使用分析：Cookie/localStorage/sessionStorage 的关键变化
7. 关键依赖关系：请求之间的依赖和时序关系
8. 复现建议：用代码伪逻辑描述如何复现整个流程`

    return { system, user }
  }

  private formatSceneHints(hints: SceneHint[]): string {
    if (hints.length === 0) return '(无场景线索)'
    return hints.map(h => `- **${h.scene}** [${h.confidence}]: ${h.evidence}`).join('\n')
  }

  private formatAuthChain(chain: AuthChainItem[]): string {
    if (chain.length === 0) return '(无鉴权数据)'
    return chain.map(a => {
      const consumers = a.consumers.length > 0 ? `\n  使用者: ${a.consumers.join(', ')}` : ''
      return `- **${a.credentialType}** (来源: ${a.source})${consumers}`
    }).join('\n')
  }

  private formatStreamingRequests(requests: FilteredRequest[]): string {
    if (requests.length === 0) return '(无流式通信)'
    return requests.map(r => `- #${r.seq} ${r.method} ${r.url}`).join('\n')
  }

  private formatRequests(requests: AssembledData['requests']): string {
    if (requests.length === 0) return '(无请求记录)'
    return requests.map(r => {
      const lines: string[] = [`#${r.seq} ${r.method} ${r.url} → ${r.status || 'pending'}`]
      const important = this.filterHeaders(r.headers)
      if (Object.keys(important).length > 0) lines.push(`  Headers: ${JSON.stringify(important)}`)
      if (r.body) lines.push(`  Body: ${r.body.length > 2000 ? r.body.substring(0, 2000) + '...' : r.body}`)
      if (r.responseBody) lines.push(`  Response: ${r.responseBody.length > 2000 ? r.responseBody.substring(0, 2000) + '...' : r.responseBody}`)
      return lines.join('\n')
    }).join('\n\n')
  }

  private formatHooks(requests: AssembledData['requests']): string {
    const allHooks = requests.flatMap(r => r.hooks)
    if (allHooks.length === 0) return '(无 JS Hook 记录)'
    return allHooks.map(h => `[${h.hook_type}] ${h.function_name}: args=${h.arguments}${h.result ? ` result=${h.result}` : ''}`).join('\n')
  }

  private formatStorageDiff(diff: AssembledData['storageDiff']): string {
    const sections: string[] = []
    for (const [type, d] of Object.entries(diff)) {
      const parts: string[] = []
      if (Object.keys(d.added).length > 0) parts.push(`  新增: ${Object.entries(d.added).map(([k, v]) => `${k}=${v}`).join(', ')}`)
      if (Object.keys(d.changed).length > 0) parts.push(`  变更: ${Object.entries(d.changed).map(([k, v]) => `${k}: "${v.old}" → "${v.new}"`).join(', ')}`)
      if (d.removed.length > 0) parts.push(`  删除: ${d.removed.join(', ')}`)
      if (parts.length > 0) sections.push(`${type}:\n${parts.join('\n')}`)
    }
    return sections.length > 0 ? sections.join('\n\n') : '(无存储变化)'
  }

  private filterHeaders(headers: Record<string, string>): Record<string, string> {
    const important = ['authorization', 'x-token', 'x-csrf-token', 'x-request-id', 'x-signature', 'content-type', 'cookie', 'referer', 'origin', 'user-agent']
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
      if (important.includes(key.toLowerCase())) result[key] = value
    }
    return result
  }
}
