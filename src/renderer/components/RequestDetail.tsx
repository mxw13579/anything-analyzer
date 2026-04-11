import React, { useMemo } from 'react'
import { Tabs, Typography, Empty, Tag, List, Descriptions } from 'antd'
import {
  SwapOutlined,
  FileTextOutlined,
  CloudDownloadOutlined,
  CodeOutlined
} from '@ant-design/icons'
import type { CapturedRequest, JsHookRecord } from '@shared/types'

const { Paragraph, Text } = Typography

interface RequestDetailProps {
  request: CapturedRequest | null
  hooks: JsHookRecord[]
}

// Safely parse JSON with fallback
function safeParse(json: string | null): Record<string, unknown> | null {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Format content for display: pretty-print JSON or show raw
function formatContent(content: string | null, contentType?: string | null): string {
  if (!content) return '(empty)'
  const isJson =
    contentType?.includes('application/json') ||
    content.trimStart().startsWith('{') ||
    content.trimStart().startsWith('[')
  if (isJson) {
    try {
      return JSON.stringify(JSON.parse(content), null, 2)
    } catch {
      return content
    }
  }
  return content
}

// Code block with copy support
const CodeBlock: React.FC<{ content: string; label?: string }> = ({ content, label }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        {label}
      </Text>
    )}
    <Paragraph
      copyable
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        padding: 12,
        borderRadius: 6,
        maxHeight: 400,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        fontFamily: 'monospace',
        fontSize: 12
      }}
    >
      {content}
    </Paragraph>
  </div>
)

// Hook type color mapping
const HOOK_TYPE_COLORS: Record<string, string> = {
  fetch: 'blue',
  xhr: 'green',
  crypto: 'purple',
  cookie_set: 'orange'
}

// Headers tab content
const HeadersTab: React.FC<{ request: CapturedRequest }> = ({ request }) => {
  const reqHeaders = safeParse(request.request_headers)
  const resHeaders = safeParse(request.response_headers)

  return (
    <div style={{ padding: '8px 0' }}>
      <CodeBlock
        label="Request Headers"
        content={
          reqHeaders
            ? JSON.stringify(reqHeaders, null, 2)
            : request.request_headers || '(none)'
        }
      />
      <CodeBlock
        label="Response Headers"
        content={
          resHeaders
            ? JSON.stringify(resHeaders, null, 2)
            : request.response_headers || '(none)'
        }
      />
    </div>
  )
}

// Body tab content
const BodyTab: React.FC<{ request: CapturedRequest }> = ({ request }) => (
  <div style={{ padding: '8px 0' }}>
    <CodeBlock
      label="Request Body"
      content={formatContent(request.request_body, request.content_type)}
    />
  </div>
)

// Response tab content
const ResponseTab: React.FC<{ request: CapturedRequest }> = ({ request }) => (
  <div style={{ padding: '8px 0' }}>
    <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="Status">{request.status_code ?? '--'}</Descriptions.Item>
      <Descriptions.Item label="Content-Type">{request.content_type ?? '--'}</Descriptions.Item>
      <Descriptions.Item label="Duration">
        {request.duration_ms != null ? `${request.duration_ms} ms` : '--'}
      </Descriptions.Item>
    </Descriptions>
    <CodeBlock
      label="Response Body"
      content={formatContent(request.response_body, request.content_type)}
    />
  </div>
)

// Hooks tab content — shows related hooks
const HooksTab: React.FC<{ hooks: JsHookRecord[] }> = ({ hooks }) => {
  if (hooks.length === 0) {
    return <Empty description="No related hooks found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }
  return (
    <List
      size="small"
      dataSource={hooks}
      renderItem={(hook) => (
        <List.Item>
          <List.Item.Meta
            title={
              <span>
                <Tag color={HOOK_TYPE_COLORS[hook.hook_type] || 'default'}>
                  {hook.hook_type}
                </Tag>
                <Text code>{hook.function_name}</Text>
              </span>
            }
            description={
              <Paragraph
                ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  marginBottom: 0
                }}
              >
                {hook.arguments}
              </Paragraph>
            }
          />
          <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
            {new Date(hook.timestamp).toLocaleTimeString()}
          </Text>
        </List.Item>
      )}
    />
  )
}

const RequestDetail: React.FC<RequestDetailProps> = ({ request, hooks }) => {
  // Filter hooks related to this request
  const relatedHooks = useMemo(() => {
    if (!request) return []
    return hooks.filter((h) => {
      // Direct match by related_request_id
      if (h.related_request_id === request.id) return true
      // Time-window fallback: hooks within 500ms before the request
      const timeDiff = request.timestamp - h.timestamp
      return timeDiff >= 0 && timeDiff <= 500
    })
  }, [request, hooks])

  if (!request) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 200
        }}
      >
        <Empty description="Select a request to view details" />
      </div>
    )
  }

  const tabItems = [
    {
      key: 'headers',
      label: (
        <span>
          <SwapOutlined /> Headers
        </span>
      ),
      children: <HeadersTab request={request} />
    },
    {
      key: 'body',
      label: (
        <span>
          <FileTextOutlined /> Body
        </span>
      ),
      children: <BodyTab request={request} />
    },
    {
      key: 'response',
      label: (
        <span>
          <CloudDownloadOutlined /> Response
        </span>
      ),
      children: <ResponseTab request={request} />
    },
    {
      key: 'hooks',
      label: (
        <span>
          <CodeOutlined /> Hooks ({relatedHooks.length})
        </span>
      ),
      children: <HooksTab hooks={relatedHooks} />
    }
  ]

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: 13 }}>
          {request.method.toUpperCase()} {request.url}
        </Text>
      </div>
      <Tabs items={tabItems} size="small" defaultActiveKey="headers" />
    </div>
  )
}

export default RequestDetail
