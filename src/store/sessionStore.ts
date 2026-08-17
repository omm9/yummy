import { create } from 'zustand'
import type { FlameLevel } from '../types/recipe'
import { useRecipeStore } from './recipeStore'

export type SessionPhase = 'idle' | 'running' | 'paused'

export interface StepRuntime {
  remainingSeconds: number
  countdownStarted: boolean
  countdownStartElapsedMs: number | null
  announced: boolean
  completed: boolean
}

interface SessionState {
  phase: SessionPhase
  recipeId: string | null
  elapsedMs: number
  runningSince: number | null
  displayElapsedMs: number
  lastSpokenFlame: FlameLevel | undefined
  voiceAvailable: boolean
  voiceNotice: string | null
  completing: boolean
  stepRuntime: Record<string, StepRuntime>
  speakingStepId: string | null
  skipNonce: number
  skippedStepId: string | null
  start: () => boolean
  pause: () => void
  resume: () => void
  stop: () => void
  skip: () => boolean
  currentElapsedMs: () => number
  tick: () => void
  markAnnounced: (stepId: string, spokenFlame: FlameLevel | undefined) => void
  startCountdown: (stepId: string) => void
  setSpeakingStepId: (stepId: string | null) => void
  setVoiceAvailable: (available: boolean, notice?: string | null) => void
}

function emptyRuntime(durationSeconds: number): StepRuntime {
  return {
    remainingSeconds: Math.max(0, durationSeconds),
    countdownStarted: false,
    countdownStartElapsedMs: null,
    announced: false,
    completed: false,
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  phase: 'idle',
  recipeId: null,
  elapsedMs: 0,
  runningSince: null,
  displayElapsedMs: 0,
  lastSpokenFlame: undefined,
  voiceAvailable: true,
  voiceNotice: null,
  completing: false,
  stepRuntime: {},
  speakingStepId: null,
  skipNonce: 0,
  skippedStepId: null,

  currentElapsedMs: () => {
    const { phase, elapsedMs, runningSince } = get()
    if (phase === 'idle') return 0
    if (phase === 'paused' || runningSince === null) return elapsedMs
    return elapsedMs + (Date.now() - runningSince)
  },

  start: () => {
    const recipe = useRecipeStore
      .getState()
      .recipes.find((r) => r.id === useRecipeStore.getState().selectedId)
    if (!recipe || recipe.steps.length === 0) return false

    const stepRuntime: Record<string, StepRuntime> = {}
    for (const step of recipe.steps) {
      stepRuntime[step.id] = emptyRuntime(step.durationSeconds)
    }

    useRecipeStore.getState().setInteractiveMode(true)
    set({
      phase: 'running',
      recipeId: recipe.id,
      elapsedMs: 0,
      runningSince: Date.now(),
      displayElapsedMs: 0,
      lastSpokenFlame: undefined,
      voiceNotice: null,
      completing: false,
      stepRuntime,
      speakingStepId: null,
      skipNonce: 0,
      skippedStepId: null,
    })
    return true
  },

  pause: () => {
    const { phase } = get()
    if (phase !== 'running') return
    const elapsedMs = get().currentElapsedMs()
    set({
      phase: 'paused',
      elapsedMs,
      runningSince: null,
      displayElapsedMs: elapsedMs,
    })
  },

  resume: () => {
    if (get().phase !== 'paused') return
    set({
      phase: 'running',
      runningSince: Date.now(),
    })
  },

  skip: () => {
    const { phase, completing, speakingStepId, stepRuntime, skipNonce } = get()
    if (phase === 'idle' || completing) return false

    const recipe = useRecipeStore
      .getState()
      .recipes.find((r) => r.id === get().recipeId)
    if (!recipe) return false

    const isOpen = (id: string) => {
      const rt = stepRuntime[id]
      return Boolean(rt) && !rt.completed
    }

    const liveIds = recipe.steps
      .filter((step) => {
        const rt = stepRuntime[step.id]
        if (!rt || rt.completed) return false
        return (
          rt.announced ||
          rt.countdownStarted ||
          speakingStepId === step.id
        )
      })
      .map((step) => step.id)

    const currentId =
      (speakingStepId && isOpen(speakingStepId) ? speakingStepId : null) ??
      liveIds[0] ??
      recipe.steps.find((step) => isOpen(step.id))?.id

    if (!currentId) return false

    const nextRuntime: Record<string, StepRuntime> = {
      ...stepRuntime,
      [currentId]: {
        remainingSeconds: 0,
        countdownStarted: true,
        countdownStartElapsedMs: get().currentElapsedMs(),
        announced: true,
        completed: true,
      },
    }

    const otherLive = liveIds.some((id) => id !== currentId)

    let elapsedMs = get().currentElapsedMs()
    const currentIndex = recipe.steps.findIndex((step) => step.id === currentId)
    const nextStep = recipe.steps
      .slice(currentIndex + 1)
      .find((step) => !nextRuntime[step.id]?.completed)

    if (!otherLive && nextStep) {
      const nextStartMs = nextStep.startSeconds * 1000
      if (nextStartMs > elapsedMs) elapsedMs = nextStartMs
    }

    const elapsedSec = Math.floor(elapsedMs / 1000)
    for (const step of recipe.steps) {
      if (step.id === currentId) continue
      const rt = nextRuntime[step.id]
      if (!rt || rt.completed || rt.countdownStarted) continue
      if (step.startSeconds > elapsedSec) continue
      nextRuntime[step.id] = {
        ...rt,
        countdownStarted: true,
        countdownStartElapsedMs: elapsedMs,
        remainingSeconds: Math.max(0, step.durationSeconds),
      }
    }

    if (nextStep && !otherLive) {
      const rt = nextRuntime[nextStep.id]
      if (rt && !rt.completed) {
        nextRuntime[nextStep.id] = {
          ...rt,
          countdownStarted: true,
          countdownStartElapsedMs: elapsedMs,
          remainingSeconds: Math.max(0, nextStep.durationSeconds),
        }
      }
    }

    const allDone = recipe.steps.every((step) => nextRuntime[step.id]?.completed)

    set({
      elapsedMs,
      runningSince: phase === 'running' ? Date.now() : null,
      displayElapsedMs: elapsedMs,
      stepRuntime: nextRuntime,
      speakingStepId: null,
      skipNonce: skipNonce + 1,
      skippedStepId: currentId,
      completing: allDone,
    })
    return true
  },

  stop: () => {
    useRecipeStore.getState().setInteractiveMode(false)
    set({
      phase: 'idle',
      recipeId: null,
      elapsedMs: 0,
      runningSince: null,
      displayElapsedMs: 0,
      lastSpokenFlame: undefined,
      voiceNotice: null,
      completing: false,
      stepRuntime: {},
      speakingStepId: null,
      skippedStepId: null,
    })
  },

  tick: () => {
    const { phase, stepRuntime, completing } = get()
    if (phase !== 'running') return

    const elapsedMs = get().currentElapsedMs()
    const recipe = useRecipeStore
      .getState()
      .recipes.find((r) => r.id === get().recipeId)
    if (!recipe) return

    const nextRuntime: Record<string, StepRuntime> = { ...stepRuntime }
    for (const step of recipe.steps) {
      const rt = nextRuntime[step.id]
      if (!rt || rt.completed) continue
      if (!rt.countdownStarted || rt.countdownStartElapsedMs === null) continue

      const elapsed = Math.floor((elapsedMs - rt.countdownStartElapsedMs) / 1000)
      const remaining = Math.max(0, step.durationSeconds - elapsed)
      nextRuntime[step.id] = {
        ...rt,
        remainingSeconds: remaining,
        completed: remaining <= 0,
      }
    }

    set({
      displayElapsedMs: elapsedMs,
      stepRuntime: nextRuntime,
    })

    if (!completing && recipe.steps.length > 0) {
      const allDone = recipe.steps.every((step) => {
        const rt = nextRuntime[step.id]
        return rt?.completed
      })
      if (allDone) {
        set({ completing: true })
      }
    }
  },

  markAnnounced: (stepId, spokenFlame) => {
    const rt = get().stepRuntime[stepId]
    if (!rt) return
    set({
      lastSpokenFlame: spokenFlame,
      stepRuntime: {
        ...get().stepRuntime,
        [stepId]: { ...rt, announced: true },
      },
    })
  },

  startCountdown: (stepId) => {
    const rt = get().stepRuntime[stepId]
    if (!rt || rt.countdownStarted) return
    const elapsedMs = get().currentElapsedMs()
    set({
      stepRuntime: {
        ...get().stepRuntime,
        [stepId]: {
          ...rt,
          announced: true,
          countdownStarted: true,
          countdownStartElapsedMs: elapsedMs,
        },
      },
    })
  },

  setVoiceAvailable: (available, notice = null) => {
    set({ voiceAvailable: available, voiceNotice: notice })
  },

  setSpeakingStepId: (stepId) => set({ speakingStepId: stepId }),
}))
