import { dequal } from 'dequal'
import * as diff from 'diff'

export function getDiff(from: unknown, to: unknown) {
  if (dequal(from, to)) {
    return 'no changes'
  }

  const diffs = diff.diffJson(
    typeof from === 'object' && from !== null ? from : String(from),
    typeof to === 'object' && to !== null ? to : String(to),
  )

  return diffs
}
