import { parse } from 'regexparam'

export function matchURLPattern(url: string, pattern: string) {
  const regex = parse(pattern)

  return exec(url, regex)
}

function exec(
  path: string,
  result: { keys: string[]; pattern: RegExp },
): Record<string, string | null> | null {
  let i = 0
  const out = {} as Record<string, string | null>

  const matches = result.pattern.exec(path)

  if (!matches) return null

  while (i < result.keys.length) {
    out[result.keys[i]!] = matches[++i] || null
  }

  return out
}
