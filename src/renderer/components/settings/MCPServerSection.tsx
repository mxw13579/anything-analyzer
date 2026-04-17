import { useEffect, useState } from 'react'
import { InputNumber, Button, Switch, Badge, useToast } from '../../ui'
import type { MCPServerSettings } from '@shared/types'

export default function MCPServerSection() {
  const toast = useToast()
  const [enabled, setEnabled] = useState(false)
  const [port, setPort] = useState(23816)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    window.electronAPI.getMCPServerConfig().then(config => {
      setEnabled(config.enabled)
      setPort(config.port)
    })
    window.electronAPI.getMCPServerStatus().then(status => {
      setRunning(status.running)
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div>
        <Badge
          color={running ? 'var(--color-success)' : 'var(--text-muted)'}
          label={running ? '运行中' : '已停止'}
          style={{ fontSize: 'var(--font-size-sm)' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--font-size-base)' }}>启用 MCP Server</span>
        <Switch checked={enabled} onChange={setEnabled} />
      </div>

      {enabled && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--font-size-base)' }}>端口</span>
            <InputNumber
              min={1024}
              max={65535}
              value={port}
              onChange={v => v !== null && setPort(v)}
              style={{ width: 120 }}
            />
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            外部工具配置 URL:{' '}
            <code style={{
              background: 'var(--color-surface)',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-mono)',
            }}>
              http://localhost:{port}/mcp
            </code>
          </div>
        </>
      )}

      <Button variant="primary" block onClick={async () => {
        const config: MCPServerSettings = { enabled, port }
        await window.electronAPI.saveMCPServerConfig(config)
        toast.success('MCP Server 配置已保存，重启应用后生效')
        const status = await window.electronAPI.getMCPServerStatus()
        setRunning(status.running)
      }}>
        保存 MCP Server 设置
      </Button>
    </div>
  )
}
