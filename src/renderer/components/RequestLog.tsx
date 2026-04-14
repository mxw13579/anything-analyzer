import React, { useMemo, useCallback } from 'react'
import { Table, Tag } from 'antd'
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface'
import type { CapturedRequest } from '@shared/types'

interface RequestLogProps {
  requests: CapturedRequest[]
  selectedId: string | null
  onSelect: (request: CapturedRequest) => void
  selectedSeqs: number[]
  onSelectedSeqsChange: (seqs: number[]) => void
}

// Color mapping for HTTP methods
const METHOD_COLORS: Record<string, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'cyan',
  HEAD: 'default',
  OPTIONS: 'default'
}

// Color for status codes
function getStatusColor(code: number | null): string {
  if (code === null) return 'default'
  if (code >= 200 && code < 300) return 'green'
  if (code >= 300 && code < 400) return 'blue'
  if (code >= 400 && code < 500) return 'gold'
  if (code >= 500) return 'red'
  return 'default'
}

// Extract path portion from a full URL
function extractPath(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search
  } catch {
    return url
  }
}

const RequestLog: React.FC<RequestLogProps> = ({ requests, selectedId, onSelect, selectedSeqs, onSelectedSeqsChange }) => {
  const columns: ColumnsType<CapturedRequest> = useMemo(
    () => [
      {
        title: '#',
        dataIndex: 'sequence',
        key: 'sequence',
        width: 60,
        sorter: (a, b) => a.sequence - b.sequence
      },
      {
        title: 'Method',
        dataIndex: 'method',
        key: 'method',
        width: 90,
        render: (method: string) => (
          <Tag color={METHOD_COLORS[method.toUpperCase()] || 'default'}>
            {method.toUpperCase()}
          </Tag>
        ),
        filters: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => ({
          text: m,
          value: m
        })),
        onFilter: (value, record) =>
          record.method.toUpperCase() === (value as string)
      },
      {
        title: 'URL',
        dataIndex: 'url',
        key: 'url',
        ellipsis: true,
        render: (_url: string, record: CapturedRequest) => (
          <span title={record.url}>
            {record.is_streaming ? <Tag color="orange" style={{ marginRight: 4 }}>SSE</Tag> : null}
            {record.is_websocket ? <Tag color="purple" style={{ marginRight: 4 }}>WS</Tag> : null}
            {extractPath(record.url)}
          </span>
        )
      },
      {
        title: 'Status',
        dataIndex: 'status_code',
        key: 'status_code',
        width: 80,
        render: (code: number | null) =>
          code !== null ? (
            <Tag color={getStatusColor(code)}>{code}</Tag>
          ) : (
            <Tag color="default">--</Tag>
          ),
        sorter: (a, b) => (a.status_code ?? 0) - (b.status_code ?? 0)
      },
      {
        title: 'Duration',
        dataIndex: 'duration_ms',
        key: 'duration_ms',
        width: 100,
        render: (ms: number | null) =>
          ms !== null ? `${ms} ms` : '--',
        sorter: (a, b) => (a.duration_ms ?? 0) - (b.duration_ms ?? 0)
      }
    ],
    []
  )

  const handleRow = useCallback(
    (record: CapturedRequest) => ({
      onClick: () => onSelect(record),
      style: {
        cursor: 'pointer',
        background: record.id === selectedId ? 'rgba(22, 119, 255, 0.15)' : undefined
      }
    }),
    [selectedId, onSelect]
  )

  // 多选配置：使用 sequence 作为选择键
  const rowSelection: TableRowSelection<CapturedRequest> = useMemo(
    () => ({
      selectedRowKeys: selectedSeqs,
      onChange: (_selectedKeys: React.Key[], selectedRows: CapturedRequest[]) => {
        onSelectedSeqsChange(selectedRows.map(r => r.sequence))
      },
      columnWidth: 40,
    }),
    [selectedSeqs, onSelectedSeqsChange]
  )

  return (
    <Table<CapturedRequest>
      columns={columns}
      dataSource={requests}
      rowKey="sequence"
      rowSelection={rowSelection}
      size="small"
      pagination={false}
      scroll={{ y: 400 }}
      virtual
      onRow={handleRow}
      rowClassName={(record) =>
        record.id === selectedId ? 'ant-table-row-selected' : ''
      }
      locale={{ emptyText: 'No requests captured yet' }}
    />
  )
}

export default RequestLog
