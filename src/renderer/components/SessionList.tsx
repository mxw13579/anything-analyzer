import React, { useState } from 'react'
import { List, Button, Badge, Typography, Modal, Form, Input, Dropdown, Empty } from 'antd'
import { PlusOutlined, GlobalOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Session } from '../../shared/types'
import type { MenuProps } from 'antd'

const { Text } = Typography

interface SessionListProps {
  sessions: Session[]
  currentSessionId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string, url: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

// Map session status to badge color
const statusColorMap: Record<string, string> = {
  running: '#52c41a',
  paused: '#faad14',
  stopped: '#8c8c8c'
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentSessionId,
  onSelect,
  onCreate,
  onDelete
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()
  const [contextMenuSessionId, setContextMenuSessionId] = useState<string | null>(null)

  const openModal = () => {
    setModalOpen(true)
    window.electronAPI.setTargetViewVisible(false)
  }

  const closeModal = () => {
    setModalOpen(false)
    form.resetFields()
    window.electronAPI.setTargetViewVisible(true)
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setCreating(true)
      await onCreate(values.name, values.targetUrl)
      form.resetFields()
      setModalOpen(false)
      window.electronAPI.setTargetViewVisible(true)
    } catch {
      // validation failed or create failed, do nothing
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Delete Session',
      content: 'Are you sure you want to delete this session? All captured data will be lost.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => onDelete(id)
    })
  }

  const getContextMenuItems = (sessionId: string): MenuProps['items'] => [
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(sessionId)
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #303030',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Text strong style={{ fontSize: 16 }}>
          Sessions
        </Text>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {sessions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No sessions"
            style={{ marginTop: 40 }}
          />
        ) : (
          <List
            dataSource={sessions}
            renderItem={(session) => (
              <Dropdown
                menu={{ items: getContextMenuItems(session.id) }}
                trigger={['contextMenu']}
                onOpenChange={(open) => {
                  if (open) setContextMenuSessionId(session.id)
                }}
              >
                <List.Item
                  onClick={() => onSelect(session.id)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    background:
                      session.id === currentSessionId ? 'rgba(22, 119, 255, 0.15)' : 'transparent',
                    borderLeft:
                      session.id === currentSessionId
                        ? '3px solid #1677ff'
                        : '3px solid transparent',
                    borderBottom: '1px solid #303030',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (session.id !== currentSessionId) {
                      ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (session.id !== currentSessionId) {
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }
                  }}
                >
                  <div style={{ width: '100%', minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4
                      }}
                    >
                      <Badge
                        color={statusColorMap[session.status] || '#8c8c8c'}
                        style={{ flexShrink: 0 }}
                      />
                      <Text
                        strong
                        ellipsis
                        style={{ flex: 1, fontSize: 14 }}
                        title={session.name}
                      >
                        {session.name}
                      </Text>
                    </div>
                    <Text
                      type="secondary"
                      ellipsis
                      style={{ fontSize: 12, display: 'block', paddingLeft: 14 }}
                      title={session.target_url}
                    >
                      <GlobalOutlined style={{ marginRight: 4 }} />
                      {session.target_url}
                    </Text>
                  </div>
                </List.Item>
              </Dropdown>
            )}
          />
        )}
      </div>

      {/* New session button */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #303030' }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          block
          onClick={() => openModal()}
        >
          New Session
        </Button>
      </div>

      {/* Create session modal */}
      <Modal
        title="Create New Session"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={closeModal}
        confirmLoading={creating}
        okText="Create"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Session Name"
            rules={[{ required: true, message: 'Please enter a session name' }]}
          >
            <Input placeholder="e.g. Login Flow Analysis" />
          </Form.Item>
          <Form.Item
            name="targetUrl"
            label="Target URL"
            rules={[
              { required: true, message: 'Please enter a target URL' },
              { type: 'url', message: 'Please enter a valid URL' }
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SessionList
