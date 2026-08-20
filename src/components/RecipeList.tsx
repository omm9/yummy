import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { downloadRecipe, parseRecipeFile } from '../lib/recipeFile'
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
  const importRecipe = useRecipeStore((s) => s.importRecipe)
  const renameRecipe = useRecipeStore((s) => s.renameRecipe)
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

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

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const recipe = parseRecipeFile(text)
      if (!importRecipe(recipe)) {
        toast.error('Stop the session before importing a recipe')
        return
      }
      toast(`Imported “${displayRecipeTitle(recipe.title)}”`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not import that file.')
    } finally {
      if (importInputRef.current) importInputRef.current.value = ''
    }
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
        <div className="flex shrink-0 flex-col items-stretch gap-1.5">
          <button
            type="button"
            onClick={createRecipe}
            disabled={interactiveMode}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              interactiveMode
                ? 'cursor-not-allowed bg-ink-100 text-ink-300'
                : 'bg-olive-600 text-white hover:bg-olive-500'
            }`}
          >
            + New
          </button>
          <button
            type="button"
            disabled={interactiveMode}
            onClick={() => importInputRef.current?.click()}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              interactiveMode
                ? 'cursor-not-allowed border-ink-100 text-ink-300'
                : 'border-ink-200 bg-white text-ink-800 hover:bg-ink-50'
            }`}
            title="Add a recipe from a downloaded JSON file"
          >
            Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import recipe file"
            onChange={(e) => {
              void handleImportFile(e.target.files?.[0])
            }}
          />
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto p-2" role="listbox" aria-label="Recipe list">
        {recipes.length === 0 ? (
          <li className="px-3 py-10 text-center text-sm text-ink-500">
            No recipes yet. Create one to get started.
          </li>
        ) : (
          recipes.map((recipe) => {
            const selected = recipe.id === selectedId
            const isRenaming = renamingId === recipe.id

            return (
              <li key={recipe.id} className="mb-1">
                <div
                  className={`group flex items-center gap-1 rounded-xl border px-2 py-1.5 transition ${
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
                    </button>
                  )}

                  {!isRenaming ? (
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => downloadRecipe(recipe)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-white hover:text-ink-800"
                        aria-label={`Download ${displayRecipeTitle(recipe.title)}`}
                        title="Download this recipe"
                      >
                        <SaveIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => startRename(recipe.id, recipe.title)}
                        disabled={interactiveMode}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-white hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Rename ${displayRecipeTitle(recipe.title)}`}
                        title="Rename"
                      >
                        <RenameIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(recipe.id, recipe.title)}
                        disabled={interactiveMode && selected}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Delete ${displayRecipeTitle(recipe.title)}`}
                        title="Delete"
                      >
                        <DeleteIcon />
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

function SaveIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M4.5 3.5h8.2L16.5 7v9.5h-13v-13Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 3.5v4h6v-4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 16.5v-5h7v5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function RenameIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M12.2 4.3 15.7 7.8 8 15.5H4.5V12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M4 6.5h12M8 6.5V4.5h4v2M6.5 6.5l.7 9h5.6l.7-9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
