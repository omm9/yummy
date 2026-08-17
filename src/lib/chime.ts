/** Short completion chime via Web Audio. Safe no-op if AudioContext is blocked. */
export function playCompletionChime(): void {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AudioCtx) return

  try {
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99]

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02 + i * 0.16)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28 + i * 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.16)
      osc.stop(now + 0.32 + i * 0.16)
    })

    window.setTimeout(() => {
      void ctx.close()
    }, 1200)
  } catch {
    // Ignore autoplay / unsupported errors
  }
}
