import { createSignalRef } from '@utils/solid'

export const activeToast = createSignalRef<string | null>(null)

let timeoutId: number | undefined

export function showToast(message: string) {
  activeToast.value = message

  clearTimeout(timeoutId)
  timeoutId = window.setTimeout(() => {
    activeToast.value = null
  }, 2000)
}
