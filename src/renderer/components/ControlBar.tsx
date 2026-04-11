import React from 'react'
import { Button, Space, Spin, Tag } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ExperimentOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import type { SessionStatus } from '../../shared/types'

interface ControlBarProps {
  status: SessionStatus | null
  onStart: () => void
  onPause: () => void
  onStop: () => void
  onAnalyze: () => void
  hasRequests: boolean
  isAnalyzing?: boolean
}

const ControlBar: React.FC<ControlBarProps> = ({
  status,
  onStart,
  onPause,
  onStop,
  onAnalyze,
  hasRequests,
  isAnalyzing = false
}) => {
  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isStopped = status === 'stopped' || status === null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: '#1a1a1a',
        borderBottom: '1px solid #303030'
      }}
    >
      <Space size={8}>
        {/* Start button */}
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          disabled={!isStopped}
          onClick={onStart}
          style={
            isStopped
              ? { background: '#389e0d', borderColor: '#389e0d' }
              : undefined
          }
        >
          Start Capture
        </Button>

        {/* Pause button */}
        <Button
          icon={<PauseCircleOutlined />}
          disabled={!isRunning}
          onClick={onPause}
          style={
            isRunning
              ? { color: '#faad14', borderColor: '#faad14' }
              : undefined
          }
        >
          Pause
        </Button>

        {/* Stop button */}
        <Button
          danger
          icon={<StopOutlined />}
          disabled={!(isRunning || isPaused)}
          onClick={onStop}
        >
          Stop
        </Button>

        {/* Analyze button */}
        <Button
          type="primary"
          icon={<ExperimentOutlined />}
          disabled={!(isStopped && hasRequests) || isAnalyzing}
          loading={isAnalyzing}
          onClick={onAnalyze}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </Button>
      </Space>

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isRunning && (
          <Tag
            color="green"
            icon={<Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} size="small" />}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Capturing...
          </Tag>
        )}
        {isPaused && <Tag color="warning">Paused</Tag>}
        {isStopped && status !== null && <Tag color="default">Stopped</Tag>}
      </div>
    </div>
  )
}

export default ControlBar
