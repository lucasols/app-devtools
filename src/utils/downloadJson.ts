export function downloadJson(value: unknown, filenamePrefix: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filenamePrefix}-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.json`
  anchor.click()

  URL.revokeObjectURL(url)
}
