import { tryExpression } from '@utils/tryExpression'

/**
 * resolves reported unused response data paths (e.g. `data[*].internal_meta`,
 * `items[0].id` or `debug_info`) against the response, so the ui can show the
 * actual unused data and how much of the response it represents
 */

export type UnusedResponseData = {
  field: string
  data: unknown
}

export type UnusedResponseDataInput =
  | string
  | UnusedResponseData
  | null
  | undefined

const WILDCARD = Symbol('wildcard')

type PathToken = string | number | typeof WILDCARD

function parsePathTokens(path: string): PathToken[] {
  const tokens: PathToken[] = []

  for (const segment of path.split('.')) {
    const bracketStart = segment.indexOf('[')

    const key = bracketStart === -1 ? segment : segment.slice(0, bracketStart)

    if (key) {
      tokens.push(key)
    }

    for (const match of segment.matchAll(/\[(\*|\d+)\]/g)) {
      const index = match[1]

      if (index === '*') {
        tokens.push(WILDCARD)
      } else if (index !== undefined) {
        tokens.push(Number(index))
      }
    }
  }

  return tokens
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function resolveTokens(
  value: unknown,
  tokens: PathToken[],
  tokenIndex: number,
): unknown {
  const token = tokens[tokenIndex]

  if (token === undefined) return value

  if (token === WILDCARD) {
    if (!isArray(value)) return undefined

    return value.map((item) => resolveTokens(item, tokens, tokenIndex + 1))
  }

  if (typeof token === 'number') {
    if (!isArray(value)) return undefined

    return resolveTokens(value[token], tokens, tokenIndex + 1)
  }

  if (!isRecord(value)) return undefined

  return resolveTokens(value[token], tokens, tokenIndex + 1)
}

export function getValueAtPath(response: unknown, path: string): unknown {
  return resolveTokens(response, parsePathTokens(path), 0)
}

export function normalizeUnusedResponseData(
  response: unknown,
  items: UnusedResponseDataInput[] | undefined,
): UnusedResponseData[] | undefined {
  if (!items) return undefined

  const normalized: UnusedResponseData[] = []

  for (const item of items) {
    if (!item) continue

    if (typeof item === 'string') {
      normalized.push({
        field: item,
        data: getValueAtPath(response, item),
      })
    } else {
      normalized.push({
        field: item.field,
        data: item.data,
      })
    }
  }

  return normalized.length > 0 ? normalized : undefined
}

/** map of unused data path -> data found at that path in the response */
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
