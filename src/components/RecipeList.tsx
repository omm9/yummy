import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { formatDuration, recipeTotalSeconds } from '../lib/time'
import {
  displayRecipeTitle,
  useRecipeStore,
} from '../store/recipeStore'

export function RecipeList() {
  const recipes = useRecipeStore((s) => s.recipes)
  const selectedId = useRecipeStore((s) => s.selectedId)
  const interactiveMode = useRecipeStore((s) => s.interactiveMode)
  const selectRecipe = useRecipeStore((s) => s.selectRecipe)
  const createRecipe = useRecipeStore((s) => s.createRecipe)
  const renameRecipe = useRecipeStore((s) => s.renameRecipe)
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [renamingId])

  const startRename = (id: string, title: string) => {
    if (interactiveMode) return
    setRenamingId(id)
    setDraftTitle(title)
  }

  const commitRename = () => {
    if (!renamingId) return
    renameRecipe(renamingId, draftTitle)
    setRenamingId(null)
  }

  const handleDelete = (id: string, title: string) => {
    if (interactiveMode && selectedId === id) {
      toast.error('Stop the session before deleting this recipe')
      return
    }
    deleteRecipe(id)
    toast(`Deleted “${displayRecipeTitle(title)}”`)
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-ink-200/80 bg-white/60 backdrop-blur-sm lg:w-72 lg:shrink-0 lg:border-r xl:w-80">
      <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-4 py-5">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-olive-600">
            Recipes
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink-950">
            Your kitchen
          </h2>
        </div>
        <button
          type="button"
          onClick={createRecipe}
          disabled={interactiveMode}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            interactiveMode
              ? 'cursor-not-allowed bg-ink-100 text-ink-300'
              : 'bg-olive-600 text-white hover:bg-olive-500'
          }`}
        >
          + New
        </button>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto p-2" role="listbox" aria-label="Recipe list">
        {recipes.length === 0 ? (
          <li className="px-3 py-10 text-center text-sm text-ink-500">
            No recipes yet. Create one to get started.
          </li>
        ) : (
          recipes.map((recipe) => {
            const selected = recipe.id === selectedId
            const total = recipeTotalSeconds(recipe.steps)
            const isRenaming = renamingId === recipe.id

            return (
              <li key={recipe.id} className="mb-1">
                <div
                  className={`group flex items-start gap-1 rounded-xl border px-2 py-2 transition ${
                    selected
                      ? 'border-olive-500/40 bg-olive-500/10'
                      : 'border-transparent hover:border-ink-100 hover:bg-ink-50/80'
                  }`}
                >
                  {isRenaming ? (
                    <input
                      ref={renameInputRef}
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      className="min-w-0 flex-1 rounded-md border border-olive-500 bg-white px-2 py-1.5 text-sm text-ink-900 outline-none ring-2 ring-olive-500/20"
                      aria-label="Rename recipe"
                    />
                  ) : (
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        if (interactiveMode) {
                          toast.error('Stop the session before switching recipes')
                          return
                        }
                        selectRecipe(recipe.id)
                      }}
                      className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left"
                    >
                      <span className="block truncate font-medium text-ink-900">
                        {displayRecipeTitle(recipe.title)}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs tabular-nums text-ink-500">
                        {recipe.steps.length} step
                        {recipe.steps.length === 1 ? '' : 's'} ·{' '}
                        {formatDuration(total)}
                      </span>
                    </button>
                  )}

                  {!isRenaming ? (
                    <div className="flex shrink-0 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => startRename(recipe.id, recipe.title)}
                        disabled={interactiveMode}
                        className="rounded-md px-2 py-1.5 text-xs font-medium text-ink-500 hover:bg-white hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Rename ${displayRecipeTitle(recipe.title)}`}
                        title="Rename"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(recipe.id, recipe.title)}
                        disabled={interactiveMode && selected}
                        className="rounded-md px-2 py-1.5 text-xs font-medium text-ink-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Delete ${displayRecipeTitle(recipe.title)}`}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })
        )}
      </ul>
    </aside>
  )
}
