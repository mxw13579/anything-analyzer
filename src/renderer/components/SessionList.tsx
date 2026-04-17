import React, { useState } from 'react'
import { Button, Input, Modal, Empty } from '../ui'
import { IconPlus, IconDelete } from '../ui/Icons'
import { useLocale } from '../i18n'
import type { Session } from '../../shared/types'
import styles from './SessionList.module.css'

interface SessionListProps {
  sessions: Session[]
  currentSessionId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string, url: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onOpenSettings: () => void
  activeRequestCount?: number
}

/**
 * Compute session bar color based on status:
 * - running/paused → green (#4ade80) — capturing
 * - stopped with target_url → blue (#60a5fa) — pending analysis
 * - stopped no url → gray (#333) — idle
 */
function getBarColor(session: Session): string {
  if (session.status === 'running' || session.status === 'paused') return 'var(--color-success)'
  if (session.status === 'stopped' && session.target_url) return 'var(--color-info)'
  return 'var(--text-disabled)'
}

function getStatusSymbol(session: Session): { symbol: string; color: string; label: string } {
  if (session.status === 'running') return { symbol: '●', color: 'var(--color-success)', label: '捕获中' }
  if (session.status === 'paused') return { symbol: '⏸', color: 'var(--color-warning)', label: '已暂停' }
  if (session.status === 'stopped' && session.target_url) return { symbol: '◎', color: 'var(--color-info)', label: '待分析' }
  return { symbol: '■', color: 'var(--text-muted)', label: '已停止' }
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentSessionId,
  onSelect,
  onCreate,
  onDelete,
  onOpenSettings,
  activeRequestCount = 0,
}) => {
  const { t } = useLocale()
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [nameError, setNameError] = useState('')
  const [urlError, setUrlError] = useState('')

  const openModal = () => {
    setModalOpen(true)
    window.electronAPI.setTargetViewVisible(false)
  }

  const closeModal = () => {
    setModalOpen(false)
    setFormName('')
    setFormUrl('')
    setNameError('')
    setUrlError('')
    window.electronAPI.setTargetViewVisible(true)
  }

  const validate = (): boolean => {
    let valid = true
    if (!formName.trim()) {
      setNameError('Please enter a session name')
      valid = false
    } else {
      setNameError('')
    }
    if (formUrl.trim()) {
      try {
        new URL(formUrl)
        setUrlError('')
      } catch {
        setUrlError('Please enter a valid URL')
        valid = false
      }
    } else {
      setUrlError('')
    }
    return valid
  }

  const handleCreate = async () => {
    if (!validate()) return
    setCreating(true)
    try {
      await onCreate(formName.trim(), formUrl.trim())
      closeModal()
    } catch {
      // create failed
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await onDelete(id)
    } catch {
      // delete failed
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={styles.container}>
      {/* Section Label */}
      <div className={styles.sectionLabel}>SESSIONS</div>

      {/* Session list */}
      <div className={styles.list}>
        {sessions.length === 0 ? (
          <Empty description="No sessions" style={{ marginTop: 40 }} />
        ) : (
          sessions.map((session) => {
            const isActive = session.id === currentSessionId
            const isHovered = session.id === hoveredId
            const barColor = getBarColor(session)
            const status = getStatusSymbol(session)
            return (
              <div
                key={session.id}
                className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                onClick={() => onSelect(session.id)}
                onMouseEnter={() => setHoveredId(session.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className={styles.sessionBar} style={{ background: barColor }} />
                <div className={styles.sessionInfo}>
                  <div className={styles.sessionName}>{session.name}</div>
                  <div className={styles.sessionMeta}>
                    <span style={{ color: status.color }}>{status.symbol} {status.label}</span>
                    {isActive && activeRequestCount > 0 && (
                      <span className={styles.sessionCount}> · {activeRequestCount} reqs</span>
                    )}
                  </div>
                </div>

                {isHovered && (
                  <span
                    className={`${styles.deleteBtn} ${deletingId === session.id ? styles.deleteBtnDisabled : ''}`}
                    onClick={(e) => handleDelete(e, session.id)}
                  >
                    <IconDelete size={13} />
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* New session button */}
      <div className={styles.footer}>
        <div className={styles.newBtn} onClick={openModal}>
          + {t('session.newSession').replace('+ ', '')}
        </div>
      </div>

      {/* Bottom: Settings + Version */}
      <div className={styles.sidebarBottom}>
        <div className={styles.bottomBtn} onClick={onOpenSettings}>⚙ {t('settings.title')}</div>
        <div className={styles.versionText}>v3.1.0</div>
      </div>

      {/* Create session modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={t('session.createTitle')}
        footer={
          <>
            <Button onClick={closeModal}>{t('session.cancel')}</Button>
            <Button variant="primary" onClick={handleCreate} loading={creating}>
              {t('session.create')}
            </Button>
          </>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('session.name')}</label>
          <Input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder={t('session.namePlaceholder')}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          {nameError && <div className={styles.formError}>{nameError}</div>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('session.targetUrl')}</label>
          <Input
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder={t('session.targetUrlPlaceholder')}
          />
          <div className={styles.formHint}>Leave empty to capture traffic via proxy only</div>
          {urlError && <div className={styles.formError}>{urlError}</div>}
        </div>
      </Modal>
    </div>
  )
}

export default SessionList
