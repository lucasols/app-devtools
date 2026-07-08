import { showToast } from '@src/utils/toast'

export async function copyToClipboard(value: unknown) {
  const text =
    typeof value === 'string'
      ? value
      : typeof value === 'object' && value !== null
      ? JSON.stringify(value, null, 2)
      : String(value)

  await navigator.clipboard.writeText(text)

  showToast('Copied to clipboard')
}
