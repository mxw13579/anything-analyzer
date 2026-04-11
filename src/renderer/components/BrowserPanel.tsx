import React, { useState, useCallback } from 'react'
import { Input, Button, Space } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  SendOutlined
} from '@ant-design/icons'

interface BrowserPanelProps {
  currentUrl?: string
  onNavigate: (url: string) => void
  onBack: () => void
  onForward: () => void
  onReload: () => void
}

const BrowserPanel: React.FC<BrowserPanelProps> = ({
  currentUrl = '',
  onNavigate,
  onBack,
  onForward,
  onReload
}) => {
  const [addressValue, setAddressValue] = useState(currentUrl)

  // Sync when currentUrl prop changes externally
  React.useEffect(() => {
    setAddressValue(currentUrl)
  }, [currentUrl])

  const handleNavigate = useCallback(() => {
    const url = addressValue.trim()
    if (!url) return

    // Auto-prepend https:// if no protocol is specified
    const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
    setAddressValue(finalUrl)
    onNavigate(finalUrl)
  }, [addressValue, onNavigate])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleNavigate()
      }
    },
    [handleNavigate]
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: '#1f1f1f',
        borderBottom: '1px solid #303030'
      }}
    >
      {/* Navigation buttons */}
      <Space size={4}>
        <Button
          type="text"
          size="small"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          title="Back"
        />
        <Button
          type="text"
          size="small"
          icon={<ArrowRightOutlined />}
          onClick={onForward}
          title="Forward"
        />
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={onReload}
          title="Reload"
        />
      </Space>

      {/* Address bar */}
      <Input
        value={addressValue}
        onChange={(e) => setAddressValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter URL..."
        style={{
          flex: 1,
          background: '#141414',
          borderColor: '#303030'
        }}
        suffix={
          <Button
            type="text"
            size="small"
            icon={<SendOutlined />}
            onClick={handleNavigate}
            title="Navigate"
          />
        }
      />
    </div>
  )
}

export default BrowserPanel
