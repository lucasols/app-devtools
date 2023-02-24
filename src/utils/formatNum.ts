const formatterCache = new Map<number | undefined, Intl.NumberFormat>()

export function formatNum(number: number, decimal?: number) {
  const formatter =
    formatterCache.get(decimal) ??
    formatterCache
      .set(
        decimal,
        new Intl.NumberFormat('en-US', {
          maximumFractionDigits: decimal,
        }),
      )
      .get(decimal)!

  return formatter.format(number)
}
