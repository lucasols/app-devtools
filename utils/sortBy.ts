type Options = { lowerFirst?: boolean }

export function sortBy<T>(
  arr: T[],
  getPriority: (item: T) => number | string,
  { lowerFirst }: Options = {},
) {
  return [...arr].sort((a, b) => {
    const aPriority = getPriority(a)
    const bPriority = getPriority(b)

    if (aPriority < bPriority) {
      return lowerFirst ? -1 : 1
    }

    if (aPriority > bPriority) {
      return lowerFirst ? 1 : -1
    }

    return 0
  })
}

export function sortByString<T>(
  arr: T[],
  getString: (item: T) => string,
  { lowerFirst: reverse }: Options = {},
) {
  return [...arr].sort((a, b) => {
    const aString = getString(a)
    const bString = getString(b)

    return (reverse ? -1 : 1) * aString.localeCompare(bString)
  })
}

type SortOrder = 'highestFirst' | 'lowestFirst'

/** Use `Infinity` as as wildcard to absulute max and min values */
export function sortByMultilevel<T>(
  arr: T[],
  getPriority: (item: T) => (number | string)[],
  {
    order = 'highestFirst',
    maxLevels,
  }: { maxLevels: number; order?: SortOrder | SortOrder[] },
) {
  return [...arr].sort((a, b) => {
    const aPriority = getPriority(a)
    const bPriority = getPriority(b)

    for (let i = 0; i < maxLevels; i++) {
      const aP = aPriority[i]
      const bP = bPriority[i]

      const levelOrder =
        typeof order === 'string' ? order : order[i] ?? 'highestFirst'

      if (aP === bP) {
        continue
      }

      if (bP === Infinity || aP === -Infinity || aP === undefined || aP < bP!) {
        return levelOrder === 'lowestFirst' ? -1 : 1
      }

      if (aP === Infinity || bP === -Infinity || bP === undefined || aP > bP) {
        return levelOrder === 'lowestFirst' ? 1 : -1
      }
    }

    return 0
  })
}
