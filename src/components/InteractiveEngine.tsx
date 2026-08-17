import { useEffect, useRef } from 'react'
import { playCompletionChime } from '../lib/chime'
import { buildStepPrompt } from '../lib/speechPrompt'
import { useRecipeStore } from '../store/recipeStore'
import { useSessionStore } from '../store/sessionStore'

const STAGGER_MS = 2500
const TICK_MS = 200

function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function InteractiveEngine() {
  const phase = useSessionStore((s) => s.phase)
  const completing = useSessionStore((s) => s.completing)
  const recipeId = useSessionStore((s) => s.recipeId)
  const skipNonce = useSessionStore((s) => s.skipNonce)
  const skippedStepId = useSessionStore((s) => s.skippedStepId)

  const queueRef = useRef<string[]>([])
  const speakingIdRef = useRef<string | null>(null)
  const gapTimerRef = useRef<number | null>(null)
  const finishingRef = useRef(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const clearGap = () => {
    if (gapTimerRef.current !== null) {
      window.clearTimeout(gapTimerRef.current)
      gapTimerRef.current = null
    }
  }

  const cancelSpeech = () => {
    clearGap()
    utteranceRef.current = null
    if (canSpeak()) window.speechSynthesis.cancel()
    if (speakingIdRef.current) {
      queueRef.current = [speakingIdRef.current, ...queueRef.current]
      speakingIdRef.current = null
      useSessionStore.getState().setSpeakingStepId(null)
    }
  }

  const startCountdownFor = (stepId: string) => {
    useSessionStore.getState().startCountdown(stepId)
  }

  const speakNext = () => {
    const session = useSessionStore.getState()
    if (session.phase !== 'running') return
    if (speakingIdRef.current) return
    if (finishingRef.current) return

    const stepId = queueRef.current.shift()
    if (!stepId) return
    if (session.stepRuntime[stepId]?.completed) {
      speakNext()
      return
    }

    const recipe = useRecipeStore
      .getState()
      .recipes.find((r) => r.id === session.recipeId)
    if (!recipe) {
      speakNext()
      return
    }
    const stepIndex = recipe.steps.findIndex((s) => s.id === stepId)
    const step = stepIndex >= 0 ? recipe.steps[stepIndex] : undefined
    if (!step) {
      speakNext()
      return
    }

    const { text, spokenFlame } = buildStepPrompt(
      step,
      stepIndex + 1,
      session.lastSpokenFlame,
    )
    session.markAnnounced(stepId, spokenFlame)

    if (!canSpeak() || !session.voiceAvailable) {
      startCountdownFor(stepId)
      gapTimerRef.current = window.setTimeout(() => {
        gapTimerRef.current = null
        speakNext()
      }, STAGGER_MS)
      return
    }

    speakingIdRef.current = stepId
    useSessionStore.getState().setSpeakingStepId(stepId)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utteranceRef.current = utterance

    const finishUtterance = () => {
      if (utteranceRef.current !== utterance) return
      utteranceRef.current = null
      speakingIdRef.current = null
      useSessionStore.getState().setSpeakingStepId(null)
      if (useSessionStore.getState().stepRuntime[stepId]?.completed) {
        if (useSessionStore.getState().phase === 'running') speakNext()
        return
      }
      startCountdownFor(stepId)
      if (useSessionStore.getState().phase !== 'running') return
      gapTimerRef.current = window.setTimeout(() => {
        gapTimerRef.current = null
        speakNext()
      }, STAGGER_MS)
    }

    utterance.onend = finishUtterance
    utterance.onerror = finishUtterance

    try {
      window.speechSynthesis.resume()
      window.speechSynthesis.speak(utterance)
    } catch {
      session.setVoiceAvailable(false, 'Voice unavailable — timers still run.')
      finishUtterance()
    }
  }

  const enqueueDueSteps = () => {
    const session = useSessionStore.getState()
    if (session.phase !== 'running' || session.completing) return

    const recipe = useRecipeStore
      .getState()
      .recipes.find((r) => r.id === session.recipeId)
    if (!recipe) return

    const elapsedSec = Math.floor(session.currentElapsedMs() / 1000)
    const queued = new Set(queueRef.current)
    if (speakingIdRef.current) queued.add(speakingIdRef.current)

    for (const step of recipe.steps) {
      const rt = session.stepRuntime[step.id]
      if (!rt || rt.announced || rt.completed) continue
      if (elapsedSec < step.startSeconds) continue
      if (queued.has(step.id)) continue
      queueRef.current.push(step.id)
      queued.add(step.id)
    }

    speakNext()
  }

  useEffect(() => {
    if (phase !== 'running') {
      if (phase === 'paused' || phase === 'idle') {
        cancelSpeech()
      }
      if (phase === 'idle') {
        queueRef.current = []
        speakingIdRef.current = null
        finishingRef.current = false
      }
      return
    }

    if (!canSpeak()) {
      useSessionStore
        .getState()
        .setVoiceAvailable(false, 'Voice unavailable — timers still run.')
    }

    const id = window.setInterval(() => {
      useSessionStore.getState().tick()
      enqueueDueSteps()
    }, TICK_MS)

    enqueueDueSteps()

    return () => window.clearInterval(id)
    // Engine re-binds when phase/recipe changes; queue lives in refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, recipeId])

  useEffect(() => {
    if (skipNonce === 0 || !skippedStepId) return
    queueRef.current = queueRef.current.filter((id) => id !== skippedStepId)
    if (useSessionStore.getState().completing) {
      speakingIdRef.current = null
      utteranceRef.current = null
      return
    }
    utteranceRef.current = null
    speakingIdRef.current = null
    useSessionStore.getState().setSpeakingStepId(null)
    if (canSpeak()) window.speechSynthesis.cancel()
    clearGap()
    gapTimerRef.current = window.setTimeout(() => {
      gapTimerRef.current = null
      const session = useSessionStore.getState()
      if (session.phase === 'running' && !session.completing) {
        enqueueDueSteps()
      }
    }, 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipNonce, skippedStepId])

  useEffect(() => {
    if (phase !== 'running' || !completing || finishingRef.current) return
    finishingRef.current = true
    clearGap()
    queueRef.current = []

    const finishSession = () => {
      playCompletionChime()
      window.setTimeout(() => {
        useSessionStore.getState().stop()
      }, 900)
    }

    const line = 'Cooking complete! Enjoy your meal.'
    if (!canSpeak() || !useSessionStore.getState().voiceAvailable) {
      finishSession()
      return
    }

    if (canSpeak()) window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(line)
    utterance.rate = 0.95
    utterance.onend = finishSession
    utterance.onerror = finishSession
    try {
      window.speechSynthesis.speak(utterance)
    } catch {
      finishSession()
    }
  }, [completing, phase])

  return null
}
