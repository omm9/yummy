export type ActivityGroupId =
  | 'pre-prep'
  | 'mechanical'
  | 'dry-heat'
  | 'moist-heat'
  | 'enclosed-heat'
  | 'mixing'
  | 'finishing'

export type ActivityId =
  | 'soak'
  | 'marinate'
  | 'ferment'
  | 'brine'
  | 'rinse'
  | 'chop'
  | 'mince'
  | 'slice'
  | 'grate'
  | 'grind'
  | 'blend'
  | 'pound'
  | 'peel'
  | 'temper'
  | 'saute'
  | 'sear'
  | 'dry-roast'
  | 'shallow-fry'
  | 'deep-fry'
  | 'boil'
  | 'simmer'
  | 'steam'
  | 'pressure-cook'
  | 'poach'
  | 'blanch'
  | 'reduce'
  | 'bake'
  | 'roast'
  | 'grill'
  | 'broil'
  | 'whisk'
  | 'fold'
  | 'knead'
  | 'dissolve'
  | 'rest'
  | 'garnish'
  | 'drizzle'

export interface ActivityDef {
  id: ActivityId
  label: string
  icon: string
}

export interface ActivityGroupDef {
  id: ActivityGroupId
  label: string
  shortLabel: string
  activities: ActivityDef[]
}

export const ACTIVITY_GROUPS: ActivityGroupDef[] = [
  {
    id: 'pre-prep',
    label: 'Pre-Prep & Soaking',
    shortLabel: 'Pre-prep',
    activities: [
      { id: 'soak', label: 'Soaking', icon: '🥣' },
      { id: 'marinate', label: 'Marinating', icon: '🥩' },
      { id: 'ferment', label: 'Fermenting / Rising', icon: '🍞' },
      { id: 'brine', label: 'Brining', icon: '🧂' },
      { id: 'rinse', label: 'Rinsing / Washing', icon: '🚰' },
    ],
  },
  {
    id: 'mechanical',
    label: 'Mechanical Prep',
    shortLabel: 'Prep',
    activities: [
      { id: 'chop', label: 'Chopping', icon: '🔪' },
      { id: 'mince', label: 'Mincing', icon: '🧄' },
      { id: 'slice', label: 'Slicing', icon: '🥒' },
      { id: 'grate', label: 'Grating', icon: '🧀' },
      { id: 'grind', label: 'Grinding', icon: '⚙️' },
      { id: 'blend', label: 'Blending', icon: '🌪️' },
      { id: 'pound', label: 'Pounding', icon: '🪵' },
      { id: 'peel', label: 'Peeling', icon: '🥔' },
    ],
  },
  {
    id: 'dry-heat',
    label: 'Dry & Low-Moisture Heat',
    shortLabel: 'Dry heat',
    activities: [
      { id: 'temper', label: 'Tempering / Tadka', icon: '💥' },
      { id: 'saute', label: 'Sautéing', icon: '🍳' },
      { id: 'sear', label: 'Searing', icon: '🥩' },
      { id: 'dry-roast', label: 'Dry roasting', icon: '🥜' },
      { id: 'shallow-fry', label: 'Shallow frying', icon: '🍤' },
      { id: 'deep-fry', label: 'Deep frying', icon: '🍟' },
    ],
  },
  {
    id: 'moist-heat',
    label: 'Wet & Moist Heat',
    shortLabel: 'Moist heat',
    activities: [
      { id: 'boil', label: 'Boiling', icon: '🫧' },
      { id: 'simmer', label: 'Simmering', icon: '🍲' },
      { id: 'steam', label: 'Steaming', icon: '💨' },
      { id: 'pressure-cook', label: 'Pressure cooking', icon: '⏲️' },
      { id: 'poach', label: 'Poaching', icon: '🥚' },
      { id: 'blanch', label: 'Blanching', icon: '🧊' },
      { id: 'reduce', label: 'Reducing', icon: '🥮' },
    ],
  },
  {
    id: 'enclosed-heat',
    label: 'Enclosed Heat',
    shortLabel: 'Oven / grill',
    activities: [
      { id: 'bake', label: 'Baking', icon: '🥖' },
      { id: 'roast', label: 'Roasting', icon: '🦤' },
      { id: 'grill', label: 'Grilling', icon: '🪵' },
      { id: 'broil', label: 'Broiling', icon: '♨️' },
    ],
  },
  {
    id: 'mixing',
    label: 'Mixing & Combining',
    shortLabel: 'Mixing',
    activities: [
      { id: 'whisk', label: 'Whisking', icon: '🥣' },
      { id: 'fold', label: 'Folding / Stirring', icon: '🥄' },
      { id: 'knead', label: 'Kneading', icon: '🍞' },
      { id: 'dissolve', label: 'Dissolving', icon: '💧' },
    ],
  },
  {
    id: 'finishing',
    label: 'Finishing & Serving',
    shortLabel: 'Finish',
    activities: [
      { id: 'rest', label: 'Resting / Cooling', icon: '⏳' },
      { id: 'garnish', label: 'Garnishing', icon: '🌿' },
      { id: 'drizzle', label: 'Drizzling', icon: '🍋' },
    ],
  },
]

const activityIndex = new Map(
  ACTIVITY_GROUPS.flatMap((g) =>
    g.activities.map((a) => [a.id, { activity: a, group: g }] as const),
  ),
)

export function getActivityMeta(activityId: ActivityId | null | undefined) {
  if (!activityId) return null
  return activityIndex.get(activityId) ?? null
}

export function isActivityId(value: string): value is ActivityId {
  return activityIndex.has(value as ActivityId)
}
