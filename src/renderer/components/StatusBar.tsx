import React from 'react'
import { useLocale } from '../i18n'
import type { SessionStatus } from '@shared/types'
import type { AppView } from './Titlebar'
import styles from './StatusBar.module.css'

interface StatusBarProps {
  status: SessionStatus | null
  requestCount: number
  hookCount: number
  sessionName?: string
  activeView?: AppView
  llmModel?: string
  tokenCount?: number
}

const StatusBar: React.FC<StatusBarProps> = ({
  status,
  requestCount,
  hookCount,
  sessionName,
  activeView = 'browser',
  llmModel,
  tokenCount,
}) => {
  const { t } = useLocale()
  const statusLabels: Record<string, { color: string; label: string; pulse: boolean }> = {
    running: { color: 'var(--color-success)', label: t('capture.running'), pulse: true },
    paused: { color: 'var(--color-warning)', label: t('capture.paused'), pulse: false },
    stopped: { color: 'var(--text-muted)', label: t('capture.stopped'), pulse: false },
  }
  const statusCfg = status ? statusLabels[status] : null

  return (
    <div className={styles.statusBar}>
      {/* Status dot + label */}
      <div className={styles.item}>
        <span
          className={`${styles.dot} ${statusCfg?.pulse ? styles.pulse : ''}`}
          style={{ background: statusCfg?.color ?? 'var(--text-disabled)' }}
        />
        <span className={styles.label}>{t('status.session')}</span>
        <span className={styles.value} style={{ color: statusCfg?.color }}>
          {statusCfg?.label ?? 'Idle'}
        </span>
      </div>

      {/* Request count */}
      <div className={styles.item}>
        <span className={styles.label}>{t('status.requests')}</span>
        <span className={styles.value}>{requestCount}</span>
      </div>

      {/* Hooks count — browser/inspector only */}
      {activeView !== 'report' && (
        <div className={styles.item}>
          <span className={styles.label}>{t('status.hooks')}</span>
          <span className={styles.value}>{hookCount}</span>
        </div>
      )}

      {/* Report view: LLM + Tokens */}
      {activeView === 'report' && llmModel && (
        <div className={styles.item}>
          <span className={styles.label}>LLM</span>
          <span className={styles.value}>{llmModel}</span>
        </div>
      )}
      {activeView === 'report' && tokenCount != null && tokenCount > 0 && (
        <div className={styles.item}>
          <span className={styles.label}>Tokens</span>
          <span className={styles.value}>{tokenCount.toLocaleString()}</span>
        </div>
      )}

      <div className={styles.spacer} />

      {/* Session name on the right */}
      {sessionName && (
        <div className={styles.item}>
          <span className={styles.value}>{sessionName}</span>
        </div>
      )}
    </div>
  )
}

export default StatusBar
