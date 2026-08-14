export interface MergedIngredient {
  /** Display line, e.g. "3 potatoes 🥔" */
  label: string
  /** Normalized key used for merging */
  key: string
}

function parseQty(raw: string): number | null {
  const cleaned = raw.replace(/\s+/g, ' ').trim()
  const mixed = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) {
    const whole = Number(mixed[1])
    const num = Number(mixed[2])
    const den = Number(mixed[3])
    if (!den) return null
    return whole + num / den
  }
  const frac = cleaned.match(/^(\d+)\/(\d+)$/)
  if (frac) {
    const num = Number(frac[1])
    const den = Number(frac[2])
    if (!den) return null
    return num / den
  }
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function formatQty(qty: number): string {
  if (Number.isInteger(qty)) return String(qty)
  const thirds = qty * 3
  if (Math.abs(thirds - Math.round(thirds)) < 1e-6) {
    const t = Math.round(thirds)
    const whole = Math.floor(t / 3)
    const rem = t % 3
    if (rem === 0) return String(whole)
    if (whole === 0) return `${rem}/3`
    return `${whole} ${rem}/3`
  }
  const halves = qty * 2
  if (Math.abs(halves - Math.round(halves)) < 1e-6) {
    const h = Math.round(halves)
    const whole = Math.floor(h / 2)
    const rem = h % 2
    if (rem === 0) return String(whole)
    if (whole === 0) return '1/2'
    return `${whole} 1/2`
  }
  const quarters = qty * 4
  if (Math.abs(quarters - Math.round(quarters)) < 1e-6) {
    const q = Math.round(quarters)
    const whole = Math.floor(q / 4)
    const rem = q % 4
    if (rem === 0) return String(whole)
    const frac = rem === 1 ? '1/4' : rem === 2 ? '1/2' : '3/4'
    if (whole === 0) return frac
    return `${whole} ${frac}`
  }
  return String(Math.round(qty * 100) / 100)
}

function parseLine(line: string): { qty: number | null; rest: string } | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const match = trimmed.match(
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s+(.+)$/,
  )
  if (match) {
    return { qty: parseQty(match[1]), rest: match[2].trim() }
  }
  return { qty: null, rest: trimmed }
}

function normalizeKey(rest: string): string {
  return rest.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Collect ingredient lines from all steps into a flat unique list.
 * Identical items (by name) merge quantities when both have parseable amounts.
 */
export function mergeIngredients(stepIngredientBlocks: string[]): MergedIngredient[] {
  type Acc = {
    key: string
    rest: string
    qty: number | null
    unparsed: string[]
  }

  const map = new Map<string, Acc>()

  for (const block of stepIngredientBlocks) {
    for (const rawLine of block.split('\n')) {
      const parsed = parseLine(rawLine)
      if (!parsed) continue
      const key = normalizeKey(parsed.rest)
      const existing = map.get(key)

      if (!existing) {
        map.set(key, {
          key,
          rest: parsed.rest,
          qty: parsed.qty,
          unparsed: parsed.qty === null ? [parsed.rest] : [],
        })
        continue
      }

      if (parsed.qty !== null && existing.qty !== null) {
        existing.qty += parsed.qty
      } else if (parsed.qty !== null && existing.qty === null) {
        existing.qty = parsed.qty
      } else if (parsed.qty === null) {
        const label = parsed.rest
        if (
          !existing.unparsed.some(
            (u) => normalizeKey(u) === normalizeKey(label),
          )
        ) {
          existing.unparsed.push(label)
        }
      }
    }
  }

  const result: MergedIngredient[] = []
  for (const item of map.values()) {
    if (item.qty !== null) {
      result.push({
        key: item.key,
        label: `${formatQty(item.qty)} ${item.rest}`,
      })
    } else {
      result.push({ key: item.key, label: item.rest })
    }
  }

  return result.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
}
