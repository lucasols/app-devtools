/**
 * approximate stored size of a value as its JSON string length, used for
 * size-based eviction budgets, returns 0 for unserializable values
 */
export function approxJsonSize(value: unknown): number {
  if (value === undefined) return 0

  try {
    const json = JSON.stringify(value)

    return typeof json === 'string' ? json.length : 0
  } catch {
    return 0
  }
}
