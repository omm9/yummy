import type { FlameLevel, Recipe, RecipeStep } from '../types/recipe'

export const RECIPE_FILE_KIND = 'yummy-recipe'
export const RECIPE_FILE_VERSION = 1

const FLAMES = new Set<FlameLevel>(['high', 'medium', 'low', null])

export function recipeDownloadName(title: string): string {
  const trimmed = title.trim()
  const slug = (trimmed.length > 0 ? trimmed : 'Untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${slug || 'recipe'}.json`
}

export function serializeRecipeFile(recipe: Recipe): string {
  const payload = {
    kind: RECIPE_FILE_KIND,
    version: RECIPE_FILE_VERSION,
    recipe: {
      title: recipe.title,
      steps: recipe.steps.map((step) => ({
        flame: step.flame,
        activityId: step.activityId,
        startSeconds: step.startSeconds,
        durationSeconds: step.durationSeconds,
        ingredients: step.ingredients,
        alternatives: step.alternatives,
        comment: step.comment ?? '',
        ...(step.optional ? { optional: true } : {}),
      })),
    },
  }
  return `${JSON.stringify(payload, null, 2)}\n`
}

export function downloadRecipe(recipe: Recipe) {
  const blob = new Blob([serializeRecipeFile(recipe)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = recipeDownloadName(recipe.title)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function parseRecipeFile(text: string): Recipe {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  const raw = unwrapRecipe(data)
  if (!raw || typeof raw !== 'object') {
    throw new Error('That file is not a Yummy recipe.')
  }

  const record = raw as Record<string, unknown>
  const title = typeof record.title === 'string' ? record.title : ''
  const stepsIn = Array.isArray(record.steps) ? record.steps : null
  if (!stepsIn) {
    throw new Error('That recipe has no steps list.')
  }

  const steps: RecipeStep[] = stepsIn.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Step ${index + 1} is invalid.`)
    }
    const step = item as Record<string, unknown>
    const durationSeconds = Number(step.durationSeconds)
    const startSeconds = Number(step.startSeconds ?? 0)
    if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
      throw new Error(`Step ${index + 1} has an invalid duration.`)
    }
    if (!Number.isFinite(startSeconds) || startSeconds < 0) {
      throw new Error(`Step ${index + 1} has an invalid start time.`)
    }
    const flame = step.flame === undefined ? null : (step.flame as FlameLevel)
    if (!FLAMES.has(flame)) {
      throw new Error(`Step ${index + 1} has an invalid flame.`)
    }

    return {
      id: crypto.randomUUID(),
      flame,
      activityId: typeof step.activityId === 'string' ? (step.activityId as RecipeStep['activityId']) : null,
      startSeconds,
      durationSeconds,
      ingredients: typeof step.ingredients === 'string' ? step.ingredients : '',
      alternatives: typeof step.alternatives === 'string' ? step.alternatives : '',
      comment: typeof step.comment === 'string' ? step.comment : '',
      ...(step.optional === true ? { optional: true } : {}),
    }
  })

  return {
    id: crypto.randomUUID(),
    title,
    steps,
  }
}

function unwrapRecipe(data: unknown): unknown {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  if (record.kind === RECIPE_FILE_KIND && record.recipe) {
    return record.recipe
  }
  if (Array.isArray(record.steps) && ('title' in record || 'id' in record)) {
    return record
  }
  return null
}
