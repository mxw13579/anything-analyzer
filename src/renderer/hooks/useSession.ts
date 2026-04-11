import { useState, useCallback, useEffect, useMemo } from 'react'
import type { Session, SessionStatus } from '../../shared/types'

export interface UseSessionReturn {
  sessions: Session[]
  currentSessionId: string | null
  currentSession: Session | null
  loading: boolean
  loadSessions: () => Promise<void>
  createSession: (name: string, url: string) => Promise<void>
  selectSession: (id: string | null) => void
  deleteSession: (id: string) => Promise<void>
  startCapture: () => Promise<void>
  pauseCapture: () => Promise<void>
  stopCapture: () => Promise<void>
}

export function useSession(): UseSessionReturn {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId) ?? null,
    [sessions, currentSessionId]
  )

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      const list = await window.electronAPI.listSessions()
      setSessions(list)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createSession = useCallback(async (name: string, url: string) => {
    try {
      const session = await window.electronAPI.createSession(name, url)
      setSessions((prev) => [...prev, session])
      setCurrentSessionId(session.id)
    } catch (err) {
      console.error('Failed to create session:', err)
      throw err
    }
  }, [])

  const selectSession = useCallback((id: string | null) => {
    setCurrentSessionId(id)
  }, [])

  const deleteSession = useCallback(
    async (id: string) => {
      try {
        await window.electronAPI.deleteSession(id)
        setSessions((prev) => prev.filter((s) => s.id !== id))
        if (currentSessionId === id) {
          setCurrentSessionId(null)
        }
      } catch (err) {
        console.error('Failed to delete session:', err)
        throw err
      }
    },
    [currentSessionId]
  )

  // Helper to update the status of the current session locally
  const updateCurrentStatus = useCallback(
    (status: SessionStatus) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, status, stopped_at: status === 'stopped' ? Date.now() : s.stopped_at }
            : s
        )
      )
    },
    [currentSessionId]
  )

  const startCapture = useCallback(async () => {
    if (!currentSessionId) return
    try {
      await window.electronAPI.startCapture(currentSessionId)
      updateCurrentStatus('running')
    } catch (err) {
      console.error('Failed to start capture:', err)
      throw err
    }
  }, [currentSessionId, updateCurrentStatus])

  const pauseCapture = useCallback(async () => {
    if (!currentSessionId) return
    try {
      await window.electronAPI.pauseCapture(currentSessionId)
      updateCurrentStatus('paused')
    } catch (err) {
      console.error('Failed to pause capture:', err)
      throw err
    }
  }, [currentSessionId, updateCurrentStatus])

  const stopCapture = useCallback(async () => {
    if (!currentSessionId) return
    try {
      await window.electronAPI.stopCapture(currentSessionId)
      updateCurrentStatus('stopped')
    } catch (err) {
      console.error('Failed to stop capture:', err)
      throw err
    }
  }, [currentSessionId, updateCurrentStatus])

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return {
    sessions,
    currentSessionId,
    currentSession,
    loading,
    loadSessions,
    createSession,
    selectSession,
    deleteSession,
    startCapture,
    pauseCapture,
    stopCapture
  }
}
