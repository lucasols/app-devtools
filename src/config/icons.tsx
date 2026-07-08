export type Icons =
  | 'network'
  | 'search'
  | 'settings'
  | 'send'
  | 'caret-down'
  | 'copy'
  | 'trash'
  | 'flag'
  | 'external-link'
  | 'download'
  | 'key'
  | 'chevrons-down-up'
  | 'chevrons-up-down'
  | 'layers'
  | 'chart-bar'
  | 'clock'
  | 'x'
  | 'terminal'
  | 'play'
  | 'file-text'
  | 'alert-triangle'
  | 'minimize-2'
  | 'eye'
  | 'eye-off'

const test = import.meta.glob('/src/assets/icons/*.svg', {
  eager: true,
  as: 'raw',
})

export function getIconSvg(icon: Icons): string {
  const svg = test[`/src/assets/icons/${icon}.svg`]

  if (import.meta.env.DEV) {
    if (!svg) {
      throw new Error(`Icon ${icon} not found`)
    }
  }

  return svg as unknown as string
}
