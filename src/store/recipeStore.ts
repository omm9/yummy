import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sampleRecipes } from '../data/sampleRecipe'
import { isActivityId, type ActivityId } from '../data/activities'
import { isCuisineId, normalizeCuisine, type CuisineId } from '../data/cuisines'
import { defaultNextStartSeconds, ensureStepStarts } from '../lib/time'
import type { FlameLevel, Recipe, RecipeStep } from '../types/recipe'

function createEmptyStep(startSeconds = 0): RecipeStep {
  return {
    id: crypto.randomUUID(),
    flame: null,
    activityId: null,
    startSeconds,
    durationSeconds: 60,
    ingredients: '',
    alternatives: '',
    comment: '',
  }
}

function createBlankRecipe(): Recipe {
  return {
    id: crypto.randomUUID(),
    title: '',
    cuisine: 'uncategorized',
    steps: [],
  }
}

function updateSelected(
  recipes: Recipe[],
  selectedId: string | null,
  updater: (recipe: Recipe) => Recipe,
): Recipe[] {
  if (!selectedId) return recipes
  return recipes.map((r) => (r.id === selectedId ? updater(r) : r))
}

function ensureStepActivities(
  steps: Array<RecipeStep & { activityId?: ActivityId | null; comment?: string }>,
): RecipeStep[] {
  return steps.map((step) => ({
    ...step,
    activityId:
      step.activityId && isActivityId(step.activityId) ? step.activityId : null,
    comment: typeof step.comment === 'string' ? step.comment : '',
  }))
}

function migrateRecipes(recipes: Recipe[]): Recipe[] {
  const sampleById = new Map(sampleRecipes.map((s) => [s.id, s]))

  const normalized = recipes.map((recipe) => {
    const sample = sampleById.get(recipe.id)
    const steps = ensureStepActivities(ensureStepStarts(recipe.steps))
    const sameShape =
      Boolean(sample) &&
      recipe.steps.length === sample!.steps.length &&
      recipe.steps.every((s, i) => s.id === sample!.steps[i]?.id)
    const missingActivity = steps.some((s) => !s.activityId)
    if (sample && sameShape && missingActivity) {
      return sample
    }
    return {
      ...recipe,
      cuisine: isCuisineId(recipe.cuisine)
        ? recipe.cuisine
        : (sample?.cuisine ?? 'uncategorized'),
      steps,
    }
  })

  const missingSamples = sampleRecipes.filter(
    (sample) => !normalized.some((r) => r.id === sample.id),
  )

  return [...normalized, ...missingSamples]
}

interface RecipeStore {
  recipes: Recipe[]
  selectedId: string | null
  interactiveMode: boolean
  lastDeletedStep: { step: RecipeStep; index: number } | null
  selectRecipe: (id: string) => void
  createRecipe: () => void
  importRecipe: (recipe: Recipe) => boolean
  renameRecipe: (id: string, title: string) => void
  deleteRecipe: (id: string) => void
  setTitle: (title: string) => void
  setCuisine: (cuisine: CuisineId) => void
  setInteractiveMode: (active: boolean) => void
  addStep: () => void
  deleteStep: (id: string) => void
  undoDeleteStep: () => void
  clearLastDeletedStep: () => void
  reorderSteps: (activeId: string, overId: string) => void
  updateStep: (id: string, patch: Partial<Omit<RecipeStep, 'id'>>) => void
  setFlame: (id: string, flame: FlameLevel) => void
}

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set, get) => ({
      recipes: sampleRecipes,
      selectedId: sampleRecipes[0]?.id ?? null,
      interactiveMode: false,
      lastDeletedStep: null,

      selectRecipe: (id) => {
        if (get().interactiveMode) return
        if (get().selectedId === id) return
        set({
          selectedId: id,
          interactiveMode: false,
          lastDeletedStep: null,
        })
      },

      createRecipe: () => {
        if (get().interactiveMode) return
        const recipe = createBlankRecipe()
        set((state) => ({
          recipes: [recipe, ...state.recipes],
          selectedId: recipe.id,
          interactiveMode: false,
          lastDeletedStep: null,
        }))
      },

      importRecipe: (recipe) => {
        if (get().interactiveMode) return false
        const steps = ensureStepActivities(ensureStepStarts(recipe.steps))
        const next: Recipe = {
          id: recipe.id || crypto.randomUUID(),
          title: recipe.title,
          steps,
        }
        set((state) => ({
          recipes: [next, ...state.recipes],
          selectedId: next.id,
          interactiveMode: false,
          lastDeletedStep: null,
        }))
        return true
      },

      renameRecipe: (id, title) => {
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id ? { ...r, title } : r,
          ),
        }))
      },

      deleteRecipe: (id) => {
        const { recipes, selectedId, interactiveMode } = get()
        if (interactiveMode && selectedId === id) return

        const next = recipes.filter((r) => r.id !== id)
        let nextSelected = selectedId
        if (selectedId === id) {
          nextSelected = next[0]?.id ?? null
        }

        set({
          recipes: next,
          selectedId: nextSelected,
          interactiveMode: false,
          lastDeletedStep: null,
        })
      },

      setTitle: (title) => {
        if (get().interactiveMode) return
        const { selectedId, recipes } = get()
        if (!selectedId) return
        set({
          recipes: recipes.map((r) =>
            r.id === selectedId ? { ...r, title } : r,
          ),
        })
      },

      setCuisine: (cuisine) => {
        if (get().interactiveMode) return
        const { selectedId, recipes } = get()
        if (!selectedId) return
        set({
          recipes: recipes.map((r) =>
            r.id === selectedId ? { ...r, cuisine: normalizeCuisine(cuisine) } : r,
          ),
        })
      },

      setInteractiveMode: (active) => set({ interactiveMode: active }),

      addStep: () => {
        if (get().interactiveMode) return
        const { selectedId, recipes } = get()
        if (!selectedId) return
        const recipe = recipes.find((r) => r.id === selectedId)
        if (!recipe) return
        const startSeconds = defaultNextStartSeconds(recipe.steps)
        set({
          recipes: updateSelected(recipes, selectedId, (r) => ({
            ...r,
            steps: [...r.steps, createEmptyStep(startSeconds)],
          })),
        })
      },

      deleteStep: (id) => {
        if (get().interactiveMode) return
        const { selectedId, recipes } = get()
        if (!selectedId) return
        const recipe = recipes.find((r) => r.id === selectedId)
        if (!recipe) return
        const index = recipe.steps.findIndex((s) => s.id === id)
        if (index === -1) return
        const step = recipe.steps[index]
        set({
          recipes: updateSelected(recipes, selectedId, (r) => ({
            ...r,
            steps: r.steps.filter((s) => s.id !== id),
          })),
          lastDeletedStep: { step, index },
        })
      },

      undoDeleteStep: () => {
        if (get().interactiveMode) return
        const { lastDeletedStep, selectedId, recipes } = get()
        if (!lastDeletedStep || !selectedId) return
        set({
          recipes: updateSelected(recipes, selectedId, (r) => {
            const next = [...r.steps]
            const insertAt = Math.min(lastDeletedStep.index, next.length)
            next.splice(insertAt, 0, lastDeletedStep.step)
            return { ...r, steps: next }
          }),
          lastDeletedStep: null,
        })
      },

      clearLastDeletedStep: () => set({ lastDeletedStep: null }),

      reorderSteps: (activeId, overId) => {
        if (get().interactiveMode) return
        if (activeId === overId) return
        const { selectedId, recipes } = get()
        if (!selectedId) return
        const recipe = recipes.find((r) => r.id === selectedId)
        if (!recipe) return
        const oldIndex = recipe.steps.findIndex((s) => s.id === activeId)
        const newIndex = recipe.steps.findIndex((s) => s.id === overId)
        if (oldIndex < 0 || newIndex < 0) return
        set({
          recipes: updateSelected(recipes, selectedId, (r) => {
            const next = [...r.steps]
            const [moved] = next.splice(oldIndex, 1)
            next.splice(newIndex, 0, moved)
            return { ...r, steps: next }
          }),
        })
      },

      updateStep: (id, patch) => {
        if (get().interactiveMode) return
        const { selectedId } = get()
        if (!selectedId) return
        set((state) => ({
          recipes: updateSelected(state.recipes, selectedId, (r) => ({
            ...r,
            steps: r.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
          })),
        }))
      },

      setFlame: (id, flame) => {
        if (get().interactiveMode) return
        const { selectedId } = get()
        if (!selectedId) return
        set((state) => ({
          recipes: updateSelected(state.recipes, selectedId, (r) => ({
            ...r,
            steps: r.steps.map((s) => (s.id === id ? { ...s, flame } : s)),
          })),
        }))
      },
    }),
    {
      name: 'recipe-execution-assistant',
      version: 5,
      partialize: (state) => ({
        recipes: state.recipes,
        selectedId: state.selectedId,
      }),
      migrate: (persisted, version) => {
        const state = persisted as {
          recipes?: Recipe[]
          selectedId?: string | null
        }

        const recipes = migrateRecipes(state.recipes ?? sampleRecipes)
        let selectedId = state.selectedId ?? recipes[0]?.id ?? null
        if (selectedId && !recipes.some((r) => r.id === selectedId)) {
          selectedId = recipes[0]?.id ?? null
        }

        // version bump path kept for future migrations
        void version

        return {
          recipes,
          selectedId,
        }
      },
    },
  ),
)

export function useSelectedRecipe(): Recipe | null {
  return useRecipeStore((s) =>
    s.recipes.find((r) => r.id === s.selectedId) ?? null,
  )
}

export function displayRecipeTitle(title: string): string {
  const trimmed = title.trim()
  return trimmed.length > 0 ? trimmed : 'Untitled'
}
