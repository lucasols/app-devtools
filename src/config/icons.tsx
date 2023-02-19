export type Icons =
  | 'add'
  | 'external'
  | 'check'
  | 'list'
  | 'home'
  | 'trash'
  | 'chevron-double-left'
  | 'warning'
  | 'close'
  | 'star'
  | 'filter'
  | 'pencil-alt'
  | 'more'
  | 'progress'
  | 'refresh'
  | 'search'
  | 'arrow-left'
  | 'view-boards'
  | 'edit'
  | 'sound'
  | 'user'
  | 'work'
  | 'double-check'
  | `chevron-${'left' | 'right' | 'up' | 'down'}`

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
