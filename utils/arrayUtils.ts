export function reverseCopy<T>(array: T[] | null | undefined) {
  if (!array) return array

  return array.slice().reverse()
}
