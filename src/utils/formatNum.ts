const formatterCache = new Map<string, Intl.NumberFormat>()

export function formatNum(number: number, options?: Intl.NumberFormatOptions) {
  const optionsKey = JSON.stringify(options)

  const formatter =
    formatterCache.get(optionsKey) ??
    formatterCache
      .set(optionsKey, new Intl.NumberFormat('en-US', options))
      .get(optionsKey)!

  return formatter.format(number)
}
