export type Icons =
  | 'network'
  | 'search'
  | 'settings'
  | 'send'

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
