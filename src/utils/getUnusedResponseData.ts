import { tryExpression } from '@utils/tryExpression'

export type UnusedResponseData = {
  field: string
  data?: unknown
}

export type UnusedResponseDataInput = UnusedResponseData | null | undefined

export function normalizeUnusedResponseData(
  items: UnusedResponseDataInput[] | undefined,
): UnusedResponseData[] | undefined {
  if (!items) return undefined

  const normalized: UnusedResponseData[] = []

  for (const item of items) {
    if (!item) continue

    normalized.push({
      field: item.field,
      data: item.data,
    })
  }

  return normalized.length > 0 ? normalized : undefined
}

/** map of unused response field -> reported unused data */
export function getUnusedResponseDataMap(
  items: UnusedResponseData[],
): Record<string, unknown> {
  const map: Record<string, unknown> = {}

  for (const item of items) {
    map[item.field] = item.data
  }

  return map
}

/** approximate size in bytes (json string length) of the unused data */
export function getUnusedResponseDataSize(items: UnusedResponseData[]): number {
  let size = 0

  for (const item of items) {
    if (item.data === undefined) continue

    size += tryExpression(() => JSON.stringify(item.data).length) || 0
  }

  return size
}
