import { cuisineDef, normalizeCuisine } from '../data/cuisines'
import type { Recipe } from '../types/recipe'

export function recipeMatchesQuery(recipe: Recipe, query: string): boolean {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
  if (words.length === 0) return true

  const title = recipe.title.trim() || 'Untitled'
  const cuisine = cuisineDef(normalizeCuisine(recipe.cuisine))
  const haystack = [
    title,
    cuisine.label,
    ...recipe.steps.flatMap((step) => [
      step.ingredients,
      step.alternatives,
      step.comment ?? '',
    ]),
  ]
    .join('\n')
    .toLowerCase()

  return words.every((word) => haystack.includes(word))
}
