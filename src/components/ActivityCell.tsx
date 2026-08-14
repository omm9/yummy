import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ACTIVITY_GROUPS,
  getActivityMeta,
  type ActivityGroupId,
  type ActivityId,
} from '../data/activities'

interface ActivityCellProps {
  value: ActivityId | null
  locked: boolean
  onChange: (activityId: ActivityId | null) => void
}

interface MenuPosition {
  top: number
  left: number
}

export function ActivityCell({ value, locked, onChange }: ActivityCellProps) {
  const meta = getActivityMeta(value)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<MenuPosition>({ top: 0, left: 0 })
  const [hoveredGroupId, setHoveredGroupId] = useState<ActivityGroupId | null>(
    meta?.group.id ?? ACTIVITY_GROUPS[0]?.id ?? null,
  )

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const closeMenu = () => {
    clearCloseTimer()
    setMenuOpen(false)
    setHoveredGroupId(meta?.group.id ?? ACTIVITY_GROUPS[0]?.id ?? null)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimer.current = window.setTimeout(() => {
      closeMenu()
    }, 180)
  }

  const keepOpen = () => {
    clearCloseTimer()
  }

  const updateMenuPosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.left,
    })
  }

  useLayoutEffect(() => {
    if (!menuOpen) return
    updateMenuPosition()

    const onReposition = () => updateMenuPosition()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      closeMenu()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen, meta?.group.id])

  useEffect(() => () => clearCloseTimer(), [])

  const hoveredGroup =
    ACTIVITY_GROUPS.find((g) => g.id === hoveredGroupId) ?? ACTIVITY_GROUPS[0]

  if (locked) {
    if (!meta) {
      return <span className="text-sm text-ink-300">—</span>
    }
    return (
      <p className="text-sm font-medium leading-snug text-ink-900">
        <span aria-hidden>{meta.activity.icon} </span>
        <span className="text-ink-500">{meta.group.shortLabel}</span>
        <span className="text-ink-300"> · </span>
        {meta.activity.label}
      </p>
    )
  }

  const triggerLabel = meta ? meta.group.shortLabel : 'Group…'

  const menu = menuOpen
    ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Activity groups"
          className="fixed z-[1000] flex rounded-lg border border-ink-200 bg-white shadow-soft"
          style={{ top: menuPos.top, left: menuPos.left }}
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
        >
          <ul className="min-w-[9.5rem] py-1">
            {ACTIVITY_GROUPS.map((group) => {
              const active = hoveredGroupId === group.id
              const selected = meta?.group.id === group.id
              return (
                <li key={group.id} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${
                      active
                        ? 'bg-ink-50 text-ink-950'
                        : 'text-ink-800 hover:bg-ink-50'
                    } ${selected ? 'font-medium text-olive-700' : ''}`}
                    onMouseEnter={() => setHoveredGroupId(group.id)}
                    onFocus={() => setHoveredGroupId(group.id)}
                    onClick={() => setHoveredGroupId(group.id)}
                  >
                    <span>{group.shortLabel}</span>
                    <span className="text-ink-300" aria-hidden>
                      ›
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {hoveredGroup ? (
            <ul
              className="max-h-[min(24rem,70vh)] min-w-[12rem] overflow-y-auto border-l border-ink-100 py-1"
              role="menu"
              aria-label={`${hoveredGroup.label} activities`}
            >
              {hoveredGroup.activities.map((activity) => {
                const selected = value === activity.id
                return (
                  <li key={activity.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                        selected
                          ? 'bg-olive-500/10 font-medium text-olive-700'
                          : 'text-ink-800 hover:bg-ink-50'
                      }`}
                      onClick={() => {
                        onChange(activity.id)
                        closeMenu()
                      }}
                    >
                      <span aria-hidden className="w-5 text-center">
                        {activity.icon}
                      </span>
                      {activity.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>,
        document.body,
      )
    : null

  return (
    <div
      ref={rootRef}
      className="relative flex w-full max-w-xl flex-nowrap items-center gap-2"
    >
      <div
        className="relative shrink-0"
        onMouseEnter={keepOpen}
        onMouseLeave={scheduleClose}
      >
        <button
          ref={triggerRef}
          type="button"
          className={`min-w-[7.5rem] rounded-md border px-2.5 py-1.5 text-left text-xs font-medium shadow-sm transition ${
            menuOpen
              ? 'border-olive-500 bg-olive-500/10 text-olive-700'
              : 'border-ink-200 bg-white text-ink-800 hover:border-ink-400'
          }`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          onClick={() => {
            setMenuOpen((open) => {
              const next = !open
              if (next) {
                setHoveredGroupId(
                  meta?.group.id ?? ACTIVITY_GROUPS[0]?.id ?? null,
                )
                // Position on next frame after open
                requestAnimationFrame(updateMenuPosition)
              }
              return next
            })
          }}
        >
          {triggerLabel}
          <span className="ml-2 text-ink-400" aria-hidden>
            ▾
          </span>
        </button>
      </div>

      {menu}

      <div
        className="flex min-w-0 flex-1 items-center rounded-md border border-dashed border-ink-200 bg-ink-50/80 px-2.5 py-1.5 text-sm text-ink-800"
        aria-live="polite"
        title="Selected activity"
      >
        {meta ? (
          <>
            <span aria-hidden className="mr-1.5 shrink-0">
              {meta.activity.icon}
            </span>
            <span className="truncate font-medium">{meta.activity.label}</span>
          </>
        ) : (
          <span className="text-ink-400">Pick an activity</span>
        )}
      </div>
    </div>
  )
}
