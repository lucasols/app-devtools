export const transitionDurations = {
  short: 160,
  medium: 240,
  long: 360,
} as const

export type TransitionDurations = keyof typeof transitionDurations

export const easings = {
  inOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0.0, 1, 1)',
  linear: 'linear',
} as const

export type TransitionEasings = keyof typeof easings

type Props = {
  duration?: TransitionDurations | number
  ease?: TransitionEasings
  properties?: string[]
  delay?: number
}

type ArrayProp = {
  property?: string
  duration?: TransitionDurations | number
  ease?: TransitionEasings
  delay?: number
}

const appendMs = (value?: string | number) =>
  value !== undefined ? `${value}ms` : ''

export function transitionShorthand({
  property,
  duration = 'medium',
  ease = 'inOut',
  delay,
}: ArrayProp = {}) {
  return `${property || ''} ${appendMs(
    typeof duration === 'number' ? duration : transitionDurations[duration],
  )} ${easings[ease]} ${appendMs(delay)}`
}

export function transition(props: Props = {}): string {
  const { properties, duration, ease, delay } = props

  return `
    transition: ${appendMs(
      typeof duration === 'number'
        ? duration
        : transitionDurations[duration || 'medium'],
    )} ${easings[ease || 'inOut']} ${appendMs(delay)};
    ${
      properties
        ? `
    transition-property: ${properties.join(', ') || ''};
    `
        : ''
    }
  `
}
