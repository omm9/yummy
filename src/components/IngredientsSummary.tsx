import { mergeIngredients } from '../lib/ingredients'

interface IngredientsSummaryProps {
  ingredientBlocks: string[]
}

export function IngredientsSummary({ ingredientBlocks }: IngredientsSummaryProps) {
  const items = mergeIngredients(ingredientBlocks)

  return (
    <section
      className="mt-6 overflow-hidden rounded-2xl border border-ink-200/80 bg-white/70 shadow-soft backdrop-blur-sm"
      aria-label="All ingredients"
    >
      <div className="border-b border-ink-100 px-4 py-3 sm:px-5">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-950">
          All ingredients
        </h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Derived from every step — duplicates merged for shopping and prep.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-400 sm:px-5">
          No ingredients yet. Add them on each timeline step.
        </p>
      ) : (
        <ul className="columns-1 gap-x-8 px-4 py-4 sm:columns-2 sm:px-5 md:columns-3">
          {items.map((item) => (
            <li
              key={item.key}
              className="mb-2 break-inside-avoid text-sm leading-relaxed text-ink-800"
            >
              <span className="mr-2 text-ink-300" aria-hidden>
                •
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
