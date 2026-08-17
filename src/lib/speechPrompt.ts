import { getActivityMeta } from '../data/activities'
import { formatSpokenDuration } from './time'
import type { FlameLevel, RecipeStep } from '../types/recipe'

const FLAME_WORDS: Record<Exclude<FlameLevel, null>, string> = {
  high: 'high',
  medium: 'medium',
  low: 'low',
}

/** Drop decorative emoji/icons so voice reads only the ingredient words. */
function stripIconsForSpeech(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE0F\u200D]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function ingredientList(step: RecipeStep): string {
  const lines = step.ingredients
    .split('\n')
    .map((line) => stripIconsForSpeech(line))
    .filter(Boolean)
  if (lines.length === 0) return ''
  if (lines.length === 1) return lines[0]
  if (lines.length === 2) return `${lines[0]} and ${lines[1]}`
  return `${lines.slice(0, -1).join(', ')}, and ${lines[lines.length - 1]}`
}

/**
 * Spoken line for a step, with labels:
 * Step N. Activity: group, leaf, for duration. Set heat to …. With ingredients: …. Alternatives: ….
 */
export function buildStepPrompt(
  step: RecipeStep,
  stepNumber: number,
  lastSpokenFlame: FlameLevel | undefined,
): { text: string; spokenFlame: FlameLevel | undefined } {
  const meta = getActivityMeta(step.activityId)
  const items = ingredientList(step)
  const chunks: string[] = [`Step ${stepNumber}.`]

  if (meta) {
    chunks.push(
      `Activity: ${meta.group.shortLabel}, ${meta.activity.label}, for ${formatSpokenDuration(step.durationSeconds)}.`,
    )
  } else {
    chunks.push(`For ${formatSpokenDuration(step.durationSeconds)}.`)
  }

  if (step.flame) {
    chunks.push(`Set heat to ${FLAME_WORDS[step.flame]}.`)
  }

  if (items) {
    chunks.push(
      step.optional
        ? `With ingredients, optionally: ${items}.`
        : `With ingredients: ${items}.`,
    )
  } else if (step.optional) {
    chunks.push('This step is optional.')
  }

  const alt = step.alternatives.trim()
  if (alt) chunks.push(`Alternatives: ${alt}.`)

  return {
    text: chunks.join(' '),
    spokenFlame: step.flame ?? lastSpokenFlame,
  }
}
