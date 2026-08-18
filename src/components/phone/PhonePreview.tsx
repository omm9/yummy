import { useEffect, useRef, useState } from 'react'
import { ModeToggle } from '../ModeToggle'
import { PhoneApp } from './PhoneApp'

const FRAME_W = 393
const FRAME_H = 852

export function PhonePreview() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const fit = () => {
      setScale(Math.min(1, el.clientWidth / FRAME_W, el.clientHeight / FRAME_H))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-ink-900">
      <div className="flex items-center justify-between px-4 py-3 text-ink-200">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
          Phone preview · 393×852 · layout A
        </p>
        <ModeToggle phone />
      </div>
      <div ref={hostRef} className="flex min-h-0 flex-1 items-center justify-center p-4">
        <div
          className="relative shrink-0"
          style={{ width: FRAME_W * scale, height: FRAME_H * scale }}
        >
          <div
            className="origin-top-left overflow-hidden rounded-[44px] border-[10px] border-ink-950 bg-[#f3f5f2] shadow-soft"
            style={{
              width: FRAME_W,
              height: FRAME_H,
              transform: `scale(${scale})`,
            }}
          >
            <div className="mx-auto mt-2 h-6 w-28 rounded-full bg-ink-950/90" />
            <div className="h-[calc(852px-2.5rem)] overflow-hidden">
              <PhoneApp />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
