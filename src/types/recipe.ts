import type { ActivityId } from '../data/activities'
import type { CuisineId } from '../data/cuisines'

export type FlameLevel = 'high' | 'medium' | 'low' | null

export interface RecipeStep {
  id: string
  flame: FlameLevel
  /** Specific cooking activity (one per step). */
  activityId: ActivityId | null
  /** When this step starts, relative to recipe start (seconds). */
  startSeconds: number
  /** Duration in seconds */
  durationSeconds: number
  /** Multi-line ingredient text (each line is one item) */
  ingredients: string
  alternatives: string
  /** Optional how-to note for this activity. Not spoken. */
  comment?: string
  optional?: boolean
}

export interface Recipe {
  id: string
  title: string
  cuisine?: CuisineId
  steps: RecipeStep[]
}
