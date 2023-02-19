const justifyValues = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
  spaceBetween: 'space-between',
  spaceAround: 'space-around',
  spaceEvenly: 'space-evenly',
} as const

const alignValues = {
  left: 'flex-start',
  right: 'flex-end',
  center: 'center',
  stretch: 'stretch',
} as const

export type StackProps = {
  justify?: keyof typeof justifyValues
  align?: keyof typeof alignValues
  gap?: string | number
}

// TODO: change spacing to gap

export const stack = ({
  justify = 'top',
  align = 'stretch',
  gap = 0,
}: StackProps = {}) =>
  `
    row-gap: ${gap}px;
    display: flex;
    flex-direction: column;
    justify-content: ${justifyValues[justify]};
    align-items: ${alignValues[align]};
  `
