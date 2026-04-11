import React, { useState } from 'react'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import type { BrowserTab } from '@shared/types'

interface TabBarProps {
  tabs: BrowserTab[]
  activeTabId: string | null
  onActivate: (tabId: string) => void
  onClose: (tabId: string) => void
  onCreate: () => void
}

/**
 * Extracts a display label for a tab: title > hostname > 'New Tab'
 */
function getTabLabel(tab: BrowserTab): string {
  if (tab.title && tab.title !== 'New Tab') return tab.title
  if (tab.url) {
    try { return new URL(tab.url).hostname || 'New Tab' } catch { /* invalid URL */ }
  }
  return 'New Tab'
}

/**
 * TabBar — Horizontal browser tab strip rendered above the embedded browser area.
 * Matches the app's dark theme. 32px tall.
 */
const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onActivate, onClose, onCreate }) => {
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null)
  const canClose = tabs.length > 1

  return (
    <div
      style={{
        height: 32,
        display: 'flex',
        alignItems: 'stretch',
        background: '#1a1a1a',
        borderBottom: '1px solid #303030',
        overflow: 'hidden',
        flexShrink: 0
      }}
    >
      {/* Scrollable tab list */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          overflow: 'hidden',
          flex: 1,
          minWidth: 0
        }}
      >
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId
          const isHovered = tab.id === hoveredTabId
          const label = getTabLabel(tab)

          return (
            <div
              key={tab.id}
              onClick={() => onActivate(tab.id)}
              onMouseEnter={() => setHoveredTabId(tab.id)}
              onMouseLeave={() => setHoveredTabId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 10px',
                minWidth: 0,
                maxWidth: 180,
                cursor: 'pointer',
                background: isActive ? '#2a2a2a' : isHovered ? '#222' : 'transparent',
                borderBottom: isActive ? '2px solid #1677ff' : '2px solid transparent',
                borderRight: '1px solid #303030',
                transition: 'background 0.15s'
              }}
            >
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  color: isActive ? '#e0e0e0' : '#8c8c8c',
                  userSelect: 'none'
                }}
                title={tab.url || label}
              >
                {label}
              </span>
              {canClose && (
                <CloseOutlined
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose(tab.id)
                  }}
                  style={{
                    fontSize: 10,
                    color: '#666',
                    flexShrink: 0,
                    opacity: isHovered || isActive ? 1 : 0,
                    transition: 'opacity 0.15s'
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* New tab button */}
      <div
        onClick={onCreate}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          flexShrink: 0,
          cursor: 'pointer',
          color: '#666',
          transition: 'color 0.15s'
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#d9d9d9' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#666' }}
        title="New Tab"
      >
        <PlusOutlined style={{ fontSize: 12 }} />
      </div>
    </div>
  )
}

export default TabBar
