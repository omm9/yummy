export type CuisineId =
  | 'indian'
  | 'italian'
  | 'mexican'
  | 'chinese'
  | 'mediterranean'
  | 'uncategorized'

export interface CuisineDef {
  id: CuisineId
  label: string
  icon: string
}

/** Built-in folders shown in the recipe list. */
export const CUISINES: CuisineDef[] = [
  { id: 'indian', label: 'Indian', icon: '🇮🇳' },
  { id: 'italian', label: 'Italian', icon: '🍝' },
  { id: 'mexican', label: 'Mexican', icon: '🌮' },
  { id: 'chinese', label: 'Chinese', icon: '🥢' },
  { id: 'mediterranean', label: 'Mediterranean', icon: '🫒' },
]

export const UNCATEGORIZED: CuisineDef = {
  id: 'uncategorized',
  label: 'Yours',
  icon: '🥘',
}

const cuisineIds = new Set<string>([
  ...CUISINES.map((c) => c.id),
  UNCATEGORIZED.id,
])

export function isCuisineId(value: string | undefined | null): value is CuisineId {
  return Boolean(value) && cuisineIds.has(value as string)
}

export function normalizeCuisine(value: unknown): CuisineId {
  return typeof value === 'string' && isCuisineId(value) ? value : 'uncategorized'
}

export function cuisineLabel(id: CuisineId): string {
  if (id === 'uncategorized') return UNCATEGORIZED.label
  return CUISINES.find((c) => c.id === id)?.label ?? UNCATEGORIZED.label
}

export function cuisineDef(id: CuisineId): CuisineDef {
  if (id === 'uncategorized') return UNCATEGORIZED
  return CUISINES.find((c) => c.id === id) ?? UNCATEGORIZED
}

export function cuisineHeading(id: CuisineId): string {
  const cuisine = cuisineDef(id)
  return `${cuisine.icon} ${cuisine.label}`
}
