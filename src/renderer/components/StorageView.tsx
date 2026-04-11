import React, { useMemo } from 'react'
import { Collapse, Table, Timeline, Empty, Tag, Typography } from 'antd'
import {
  DatabaseOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import type { StorageSnapshot, StorageType } from '@shared/types'

const { Text } = Typography

interface StorageViewProps {
  snapshots: StorageSnapshot[]
}

// Icons and labels for storage types
const STORAGE_META: Record<StorageType, { label: string; icon: React.ReactNode; color: string }> = {
  cookie: { label: 'Cookies', icon: <SafetyCertificateOutlined />, color: 'orange' },
  localStorage: { label: 'Local Storage', icon: <DatabaseOutlined />, color: 'blue' },
  sessionStorage: { label: 'Session Storage', icon: <AppstoreOutlined />, color: 'green' }
}

// Parse JSON data string into key-value entries
function parseStorageData(data: string): Array<{ key: string; value: string }> {
  try {
    const parsed = JSON.parse(data)
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      }))
    }
  } catch {
    // Ignore parse errors
  }
  return []
}

// Compute diff between two snapshots
function computeDiff(
  oldData: string,
  newData: string
): Array<{ key: string; action: 'added' | 'removed' | 'changed'; oldValue?: string; newValue?: string }> {
  const oldEntries = parseStorageData(oldData)
  const newEntries = parseStorageData(newData)
  const oldMap = new Map(oldEntries.map((e) => [e.key, e.value]))
  const newMap = new Map(newEntries.map((e) => [e.key, e.value]))
  const diffs: Array<{
    key: string
    action: 'added' | 'removed' | 'changed'
    oldValue?: string
    newValue?: string
  }> = []

  // Check for added or changed keys
  for (const [key, value] of newMap) {
    if (!oldMap.has(key)) {
      diffs.push({ key, action: 'added', newValue: value })
    } else if (oldMap.get(key) !== value) {
      diffs.push({ key, action: 'changed', oldValue: oldMap.get(key), newValue: value })
    }
  }

  // Check for removed keys
  for (const [key] of oldMap) {
    if (!newMap.has(key)) {
      diffs.push({ key, action: 'removed', oldValue: oldMap.get(key) })
    }
  }

  return diffs
}

// Key-value table for storage entries
const KVTable: React.FC<{ entries: Array<{ key: string; value: string }> }> = ({ entries }) => (
  <Table
    size="small"
    pagination={false}
    dataSource={entries}
    rowKey="key"
    columns={[
      {
        title: 'Key',
        dataIndex: 'key',
        key: 'key',
        width: '35%',
        ellipsis: true,
        render: (key: string) => <Text code>{key}</Text>
      },
      {
        title: 'Value',
        dataIndex: 'value',
        key: 'value',
        ellipsis: true,
        render: (value: string) => (
          <Text
            style={{ fontFamily: 'monospace', fontSize: 12 }}
            ellipsis={{ tooltip: value }}
          >
            {value}
          </Text>
        )
      }
    ]}
  />
)

// Diff timeline for multiple snapshots
const DiffTimeline: React.FC<{ snapshots: StorageSnapshot[] }> = ({ snapshots }) => {
  if (snapshots.length < 2) return null

  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp)
  const timelineItems = []

  for (let i = 1; i < sorted.length; i++) {
    const diffs = computeDiff(sorted[i - 1].data, sorted[i].data)
    if (diffs.length === 0) continue

    const DIFF_COLORS: Record<string, string> = {
      added: 'green',
      removed: 'red',
      changed: 'blue'
    }

    timelineItems.push({
      key: `diff-${i}`,
      color: 'blue',
      children: (
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {new Date(sorted[i].timestamp).toLocaleString()}
          </Text>
          <div style={{ marginTop: 4 }}>
            {diffs.map((d) => (
              <div key={d.key} style={{ marginBottom: 2 }}>
                <Tag color={DIFF_COLORS[d.action]} style={{ fontSize: 11 }}>
                  {d.action}
                </Tag>
                <Text code style={{ fontSize: 11 }}>
                  {d.key}
                </Text>
                {d.newValue && (
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, marginLeft: 4 }}
                  >
                    = {d.newValue.length > 60 ? d.newValue.slice(0, 60) + '...' : d.newValue}
                  </Text>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    })
  }

  if (timelineItems.length === 0) return null

  return (
    <div style={{ marginTop: 12 }}>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        Changes Timeline
      </Text>
      <Timeline items={timelineItems} />
    </div>
  )
}

// Single storage type section
const StorageSection: React.FC<{
  type: StorageType
  snapshots: StorageSnapshot[]
}> = ({ type, snapshots }) => {
  const meta = STORAGE_META[type]
  const sorted = [...snapshots].sort((a, b) => b.timestamp - a.timestamp)
  const latestEntries = sorted.length > 0 ? parseStorageData(sorted[0].data) : []

  return (
    <div>
      {latestEntries.length > 0 ? (
        <>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
            Latest snapshot: {new Date(sorted[0].timestamp).toLocaleString()}
            {' | '}{latestEntries.length} entries | Domain: {sorted[0].domain}
          </Text>
          <KVTable entries={latestEntries} />
          {sorted.length > 1 && <DiffTimeline snapshots={sorted} />}
        </>
      ) : (
        <Empty
          description={`No ${meta.label.toLowerCase()} data`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  )
}

const StorageView: React.FC<StorageViewProps> = ({ snapshots }) => {
  // Group snapshots by storage type
  const grouped = useMemo(() => {
    const groups: Record<StorageType, StorageSnapshot[]> = {
      cookie: [],
      localStorage: [],
      sessionStorage: []
    }
    for (const snap of snapshots) {
      if (groups[snap.storage_type]) {
        groups[snap.storage_type].push(snap)
      }
    }
    return groups
  }, [snapshots])

  if (snapshots.length === 0) {
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
        <Empty description="No storage snapshots captured yet" />
      </div>
    )
  }

  const collapseItems = (['cookie', 'localStorage', 'sessionStorage'] as StorageType[]).map(
    (type) => {
      const meta = STORAGE_META[type]
      const count = grouped[type].length
      return {
        key: type,
        label: (
          <span>
            {meta.icon}{' '}
            <span style={{ marginLeft: 4 }}>{meta.label}</span>
            {count > 0 && (
              <Tag color={meta.color} style={{ marginLeft: 8 }}>
                {count} snapshot{count > 1 ? 's' : ''}
              </Tag>
            )}
          </span>
        ),
        children: <StorageSection type={type} snapshots={grouped[type]} />
      }
    }
  )

  return (
    <Collapse
      defaultActiveKey={['cookie', 'localStorage', 'sessionStorage']}
      items={collapseItems}
      size="small"
    />
  )
}

export default StorageView
