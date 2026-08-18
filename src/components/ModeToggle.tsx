import { navigatePreview } from '../lib/previewNav'

export function ModeToggle({ phone }: { phone: boolean }) {
  const wrap = phone
    ? 'flex rounded-lg border border-ink-600 bg-ink-800 p-0.5 text-xs font-semibold'
    : 'fixed right-3 top-3 z-50 flex rounded-lg border border-ink-200 bg-white/90 p-0.5 text-xs font-semibold shadow-soft backdrop-blur-sm'

  const idle = phone
    ? 'rounded-md px-2.5 py-1.5 text-ink-300 hover:text-white'
    : 'rounded-md px-2.5 py-1.5 text-ink-500 hover:text-ink-800'

  const active = phone
    ? 'rounded-md bg-white px-2.5 py-1.5 text-ink-900'
    : 'rounded-md bg-ink-900 px-2.5 py-1.5 text-white'

  return (
    <div className={wrap}>
      <button
        type="button"
        onClick={() => navigatePreview('/')}
        className={phone ? idle : active}
      >
        Desktop
      </button>
      <button
        type="button"
        onClick={() => navigatePreview('/phone')}
        className={phone ? active : idle}
      >
        Phone
      </button>
    </div>
  )
}
