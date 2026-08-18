import type { Recipe, RecipeStep } from '../types/recipe'
import type { StepRuntime } from '../store/sessionStore'

export function isStepLive(rt: StepRuntime | undefined, speaking: boolean): boolean {
  if (!rt || rt.completed) return false
  return speaking || rt.announced || rt.countdownStarted
}

/** Lowest-number step that is speaking, counting down, or next incomplete. */
export function getNowStep(
  recipe: Recipe,
  stepRuntime: Record<string, StepRuntime>,
  speakingStepId: string | null,
): { step: RecipeStep; index: number } | null {
  if (speakingStepId) {
    const index = recipe.steps.findIndex((s) => s.id === speakingStepId)
    const step = index >= 0 ? recipe.steps[index] : undefined
    if (step && !stepRuntime[step.id]?.completed) {
      return { step, index }
    }
  }

  for (let index = 0; index < recipe.steps.length; index++) {
    const step = recipe.steps[index]
    if (isStepLive(stepRuntime[step.id], false)) {
      return { step, index }
    }
  }

  for (let index = 0; index < recipe.steps.length; index++) {
    const step = recipe.steps[index]
    if (!stepRuntime[step.id]?.completed) {
      return { step, index }
    }
  }

  return null
}
