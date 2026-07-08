function getSimplifiedType(value: unknown, getStringLength = true): string {
  if (value === '') return 'empty string'

  if (typeof value === 'string' && getStringLength) {
    return `string (length: ${value.length})`
  }

  const baseType = value === null ? 'null' : typeof value

  if (baseType === 'object') return 'object'

  return baseType
}

/**
 * Replaces all values in the data with a description of their type, keeping
 * only the data structure, so it can be shared without leaking sensitive data
 */
export function removeSensitiveData(
  obj: unknown,
  maxDepth = 4,
  walkArrayItems = false,
): unknown {
  const cleanData: Record<string, unknown> = {}

  if (!obj || typeof obj !== 'object') return getSimplifiedType(obj)

  const entries = Object.entries(obj)

  if (entries.length === 0) {
    return Array.isArray(obj) ? '[]' : '{}'
  }

  if (Array.isArray(obj)) {
    if (!walkArrayItems || maxDepth < 1) {
      const arrayItemsType = new Set<string>()

      for (const item of obj) {
        arrayItemsType.add(getSimplifiedType(item, false))
      }

      return `array(length: ${obj.length}) of: ${[...arrayItemsType].join(
        ' | ',
      )}`
    }

    return obj.map((item: unknown) =>
      removeSensitiveData(item, maxDepth - 1, true),
    )
  }

  if (maxDepth < 1) return 'any object'

  for (const [key, value] of entries) {
    const valueType = getSimplifiedType(value)

    cleanData[key] =
      valueType === 'object'
        ? removeSensitiveData(value, maxDepth - 1)
        : valueType
  }

  return cleanData
}
