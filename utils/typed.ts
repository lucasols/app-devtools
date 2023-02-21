/** a wrapper to Object.entries with a better typing inference */
export function typedObjectEntries<T extends object>(
  obj: T,
): NonNullable<
  {
    [K in keyof T]: [K, T[K]]
  }[keyof T]
>[] {
  return Object.entries(obj) as any
}

/** a wrapper to Object.keys with a better typing inference */
export function typedObjectKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as any
}

export function arrayIsNotEmpty<T>(arr: T[] | null | undefined): arr is T[] {
  return !!arr && arr.length !== 0
}

export function asType<T>(value: T): T {
  return value as T
}
