import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { toast } from 'sonner'
import { CUISINES, UNCATEGORIZED, normalizeCuisine, type CuisineId } from '../data/cuisines'
import { downloadRecipe, parseRecipeFile } from '../lib/recipeFile'
import { recipeMatchesQuery } from '../lib/recipeSearch'
import {
  displayRecipeTitle,
  useRecipeStore,
} from '../store/recipeStore'
import type { Recipe } from '../types/recipe'

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
  const [query, setQuery] = useState('')
  const [openCuisine, setOpenCuisine] = useState<CuisineId | null>(() => {
    const current = useRecipeStore.getState().recipes.find(
      (r) => r.id === useRecipeStore.getState().selectedId,
    )
    return normalizeCuisine(current?.cuisine)
  })

  useEffect(() => {
    const recipe = useRecipeStore
      .getState()
      .recipes.find((r) => r.id === selectedId)
    if (recipe) setOpenCuisine(normalizeCuisine(recipe.cuisine))
  }, [selectedId])

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

  const searching = query.trim().length > 0

  const groups = useMemo(() => {
    const byCuisine = new Map(CUISINES.map((c) => [c.id, [] as Recipe[]]))
    const yours: Recipe[] = []
    for (const recipe of recipes) {
      if (!recipeMatchesQuery(recipe, query)) continue
      const id = normalizeCuisine(recipe.cuisine)
      if (id === 'uncategorized') {
        yours.push(recipe)
      } else {
        byCuisine.get(id)?.push(recipe)
      }
    }
    const folders = CUISINES.map((cuisine) => ({
      cuisine,
      recipes: byCuisine.get(cuisine.id) ?? [],
    }))
    if (yours.length > 0) {
      folders.push({ cuisine: UNCATEGORIZED, recipes: yours })
    }
    if (searching) {
      return folders.filter((folder) => folder.recipes.length > 0)
    }
    return folders
  }, [recipes, query, searching])

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

      <div className="border-b border-ink-100 px-3 py-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes"
          aria-label="Search recipes"
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-400 focus:border-olive-500 focus:ring-2 focus:ring-olive-500/30"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2" role="list">
        {recipes.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-ink-500">
            No recipes yet. Create one to get started.
          </p>
        ) : groups.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-ink-500">
            No recipes match.
          </p>
        ) : (
          groups.map(({ cuisine, recipes: items }) => {
            const open = searching || openCuisine === cuisine.id
            return (
              <div key={cuisine.id} className="mb-1">
                <button
                  type="button"
                  onClick={() =>
                    setOpenCuisine((current) =>
                      current === cuisine.id ? null : cuisine.id,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-semibold text-ink-800 hover:bg-ink-50/80"
                  aria-expanded={open}
                >
                  <span>
                    <span className="mr-1.5" aria-hidden>
                      {cuisine.icon}
                    </span>
                    {cuisine.label}
                  </span>
                  <span className="font-mono text-xs font-medium text-ink-400">
                    {open ? '−' : '+'} {items.length}
                  </span>
                </button>
                {open ? (
                  <ul className="mt-0.5" role="listbox" aria-label={cuisine.label}>
                    {items.length === 0 ? (
                      <li className="px-3 py-2 text-xs text-ink-400">
                        No dishes yet
                      </li>
                    ) : (
                      items.map((recipe) => (
                        <RecipeRow
                          key={recipe.id}
                          recipe={recipe}
                          selected={recipe.id === selectedId}
                          isRenaming={renamingId === recipe.id}
                          draftTitle={draftTitle}
                          renameInputRef={renameInputRef}
                          interactiveMode={interactiveMode}
                          onSelect={() => {
                            if (interactiveMode) {
                              toast.error('Stop the session before switching recipes')
                              return
                            }
                            selectRecipe(recipe.id)
                          }}
                          onDraftTitle={setDraftTitle}
                          onCommitRename={commitRename}
                          onCancelRename={() => setRenamingId(null)}
                          onDownload={() => downloadRecipe(recipe)}
                          onRename={() => startRename(recipe.id, recipe.title)}
                          onDelete={() => handleDelete(recipe.id, recipe.title)}
                        />
                      ))
                    )}
                  </ul>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}

function RecipeRow({
  recipe,
  selected,
  isRenaming,
  draftTitle,
  renameInputRef,
  interactiveMode,
  onSelect,
  onDraftTitle,
  onCommitRename,
  onCancelRename,
  onDownload,
  onRename,
  onDelete,
}: {
  recipe: Recipe
  selected: boolean
  isRenaming: boolean
  draftTitle: string
  renameInputRef: RefObject<HTMLInputElement>
  interactiveMode: boolean
  onSelect: () => void
  onDraftTitle: (value: string) => void
  onCommitRename: () => void
  onCancelRename: () => void
  onDownload: () => void
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <li className="mb-1">
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
            onChange={(e) => onDraftTitle(e.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitRename()
              if (e.key === 'Escape') onCancelRename()
            }}
            className="min-w-0 flex-1 rounded-md border border-olive-500 bg-white px-2 py-1.5 text-sm text-ink-900 outline-none ring-2 ring-olive-500/20"
            aria-label="Rename recipe"
          />
        ) : (
          <button
            type="button"
            role="option"
            aria-selected={selected}
            onClick={onSelect}
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
              onClick={onDownload}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-white hover:text-ink-800"
              aria-label={`Download ${displayRecipeTitle(recipe.title)}`}
              title="Download this recipe"
            >
              <SaveIcon />
            </button>
            <button
              type="button"
              onClick={onRename}
              disabled={interactiveMode}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-white hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Rename ${displayRecipeTitle(recipe.title)}`}
              title="Rename"
            >
              <RenameIcon />
            </button>
            <button
              type="button"
              onClick={onDelete}
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
