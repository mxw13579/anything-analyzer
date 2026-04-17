import React, { useState, useEffect, useCallback } from 'react'
import { IconMinimize, IconMaximize, IconClose, IconSun, IconMoon, IconGlobe, IconCode, IconRobot } from '../ui/Icons'
import { useLocale } from '../i18n'
import type { LocaleKey } from '../i18n'
import styles from './Titlebar.module.css'

export type AppView = 'browser' | 'inspector' | 'report'

interface TitlebarProps {
  theme: 'dark' | 'light'
  onThemeToggle: () => void
  locale: 'en' | 'zh'
  onLocaleToggle: () => void
  activeView: AppView
  onViewChange: (view: AppView) => void
  requestCount?: number
}

const navTabs: { key: AppView; labelKey: LocaleKey; icon: React.ReactNode }[] = [
  { key: 'browser', labelKey: 'nav.browser', icon: <IconGlobe size={13} /> },
  { key: 'inspector', labelKey: 'nav.inspector', icon: <IconCode size={13} /> },
  { key: 'report', labelKey: 'nav.report', icon: <IconRobot size={13} /> },
]

const Titlebar: React.FC<TitlebarProps> = ({
  theme,
  onThemeToggle,
  locale,
  onLocaleToggle,
  activeView,
  onViewChange,
  requestCount = 0,
}) => {
  const { t } = useLocale()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI.isWindowMaximized().then(setIsMaximized)
  }, [])

  const handleMinimize = useCallback(() => {
    window.electronAPI.minimizeWindow()
  }, [])

  const handleMaximize = useCallback(async () => {
    await window.electronAPI.maximizeWindow()
    const maximized = await window.electronAPI.isWindowMaximized()
    setIsMaximized(maximized)
  }, [])

  const handleClose = useCallback(() => {
    window.electronAPI.closeWindow()
  }, [])

  return (
    <div className={styles.titlebar}>
      {/* Logo area — matches sidebar width */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>A</div>
        <span className={styles.logoText}>Anything Analyzer</span>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        {navTabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeView === tab.key ? styles.tabActive : ''}`}
            onClick={() => onViewChange(tab.key)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {t(tab.labelKey)}
            {tab.key === 'inspector' && requestCount > 0 && (
              <span className={styles.tabBadge}>{requestCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Draggable spacer */}
      <div className={styles.spacer} />

      {/* Right controls */}
      <div className={styles.rightControls}>
        {/* Language toggle */}
        <button className={styles.langSwitch} onClick={onLocaleToggle}>
          <span className={locale === 'zh' ? styles.langActive : ''}>中</span>
          {' / '}
          <span className={locale === 'en' ? styles.langActive : ''}>En</span>
        </button>

        {/* Theme toggle */}
        <button className={styles.actionBtn} onClick={onThemeToggle} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
        </button>

        <div className={styles.separator} />
      </div>

      {/* Window controls */}
      <div className={styles.windowControls}>
        <button className={styles.windowBtn} onClick={handleMinimize}>
          <IconMinimize size={12} />
        </button>
        <button className={styles.windowBtn} onClick={handleMaximize}>
          <IconMaximize size={12} />
        </button>
        <button className={`${styles.windowBtn} ${styles.windowBtnClose}`} onClick={handleClose}>
          <IconClose size={12} />
        </button>
      </div>
    </div>
  )
}

export default Titlebar
