import React, { useMemo } from 'react'
import { Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { JsHookRecord, HookType } from '@shared/types'

const { Paragraph, Text } = Typography

interface HookLogProps {
  hooks: JsHookRecord[]
}

// Color mapping for hook types
const HOOK_TYPE_COLORS: Record<HookType, string> = {
  fetch: 'blue',
  xhr: 'green',
  crypto: 'purple',
  cookie_set: 'orange'
}

// Truncate long strings for table display
function truncate(str: string | null, maxLen = 80): string {
  if (!str) return '--'
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
}

// Pretty-format JSON string for expanded view
function prettyJson(str: string | null): string {
  if (!str) return '(empty)'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

// Expanded row content showing full hook details
const ExpandedRow: React.FC<{ record: JsHookRecord }> = ({ record }) => (
  <div style={{ padding: '8px 16px' }}>
    <div style={{ marginBottom: 12 }}>
      <Text strong style={{ display: 'block', marginBottom: 4 }}>
        Arguments
      </Text>
      <Paragraph
        copyable
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          padding: 10,
          borderRadius: 6,
          fontFamily: 'monospace',
          fontSize: 12,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          marginBottom: 0
        }}
      >
        {prettyJson(record.arguments)}
      </Paragraph>
    </div>

    {record.result && (
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>
          Result
        </Text>
        <Paragraph
          copyable
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: 10,
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            marginBottom: 0
          }}
        >
          {prettyJson(record.result)}
        </Paragraph>
      </div>
    )}

    {record.call_stack && (
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>
          Call Stack
        </Text>
        <Paragraph
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: 10,
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: 11,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            marginBottom: 0,
            color: 'rgba(255, 255, 255, 0.45)'
          }}
        >
          {record.call_stack}
        </Paragraph>
      </div>
    )}

    {record.related_request_id && (
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Related Request ID: <Text code>{record.related_request_id}</Text>
        </Text>
      </div>
    )}
  </div>
)

const HookLog: React.FC<HookLogProps> = ({ hooks }) => {
  const columns: ColumnsType<JsHookRecord> = useMemo(
    () => [
      {
        title: 'Time',
        dataIndex: 'timestamp',
        key: 'timestamp',
        width: 100,
        render: (ts: number) => new Date(ts).toLocaleTimeString(),
        sorter: (a, b) => a.timestamp - b.timestamp,
        defaultSortOrder: 'descend'
      },
      {
        title: 'Type',
        dataIndex: 'hook_type',
        key: 'hook_type',
        width: 110,
        render: (type: HookType) => (
          <Tag color={HOOK_TYPE_COLORS[type]}>{type}</Tag>
        ),
        filters: (['fetch', 'xhr', 'crypto', 'cookie_set'] as HookType[]).map(
          (t) => ({ text: t, value: t })
        ),
        onFilter: (value, record) => record.hook_type === value
      },
      {
        title: 'Function',
        dataIndex: 'function_name',
        key: 'function_name',
        width: 160,
        render: (name: string) => <Text code>{name}</Text>
      },
      {
        title: 'Arguments',
        dataIndex: 'arguments',
        key: 'arguments',
        ellipsis: true,
        render: (args: string) => (
          <span
            style={{ fontFamily: 'monospace', fontSize: 12 }}
            title={args}
          >
            {truncate(args)}
          </span>
        )
      },
      {
        title: 'Result',
        dataIndex: 'result',
        key: 'result',
        width: 200,
        ellipsis: true,
        render: (result: string | null) => (
          <span
            style={{ fontFamily: 'monospace', fontSize: 12 }}
            title={result || ''}
          >
            {truncate(result)}
          </span>
        )
      }
    ],
    []
  )

  return (
    <Table<JsHookRecord>
      columns={columns}
      dataSource={hooks}
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ y: 400 }}
      virtual
      expandable={{
        expandedRowRender: (record) => <ExpandedRow record={record} />,
        rowExpandable: () => true
      }}
      locale={{ emptyText: 'No hook records captured yet' }}
    />
  )
}

export default HookLog
