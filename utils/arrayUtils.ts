export function reverseCopy<T>(array: T[] | null | undefined): T[] {
  if (!array) return []

  return array.slice().reverse()
}

export function withIndex<T>(array: T[]): [T, number][] {
  return array.map((item, index) => [item, index])
}

export function mapArrayToMap<
  K extends string | number,
  T extends any[] | readonly any[],
  O,
>(
  array: T,
  mapFunction: (item: T[number], index: number) => [key: K, value: O],
): Map<K, O> {
  const map = new Map<K, O>()

  for (let i = 0; i < array.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const [key, value] = mapFunction(array[i], i)

    map.set(key, value)
  }

  return map
}

export function concatNonNullable<T>(
  ...arrays: (T[] | null | undefined)[]
): T[] {
  const result: T[] = []

  for (const array of arrays) {
    if (array !== null && array !== undefined) {
      result.push(...array)
    }
  }

  return result
}

export function filterNonNullableElements<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((item) => item !== null && item !== undefined) as T[]
}
