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
  | 'pause'
  | 'file-text'
  | 'alert-triangle'
  | 'minimize-2'
  | 'eye'
  | 'eye-off'

const icons = import.meta.glob<string>('/src/assets/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export function getIconSvg(icon: Icons): string {
  const svg = icons[`/src/assets/icons/${icon}.svg`]

  if (svg === undefined) {
    if (import.meta.env.DEV) {
      throw new Error(`Icon ${icon} not found`)
    }

    return ''
  }

  return svg
}
