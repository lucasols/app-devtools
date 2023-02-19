import { parseUnit } from '@utils/parseUnit'

type Unit = string | number

// TODO: add two margin options

function getDimension(margin: Unit | [Unit, Unit]) {
  return Array.isArray(margin)
    ? `calc(100% - (${parseUnit(margin[0])} + ${parseUnit(margin[1])}))`
    : `calc(100% - (${parseUnit(margin)} * 2))`
}

export const responsiveWidth = (
  maxWidth: Unit,
  margin: Unit | [Unit, Unit] = 0,
) => `
  max-width: ${parseUnit(maxWidth)};
  width: ${getDimension(margin)};
`

export const responsiveHeight = (
  height: Unit,
  margin: Unit | [Unit, Unit] = 0,
) => `
  max-height: ${parseUnit(height)};
  height: ${getDimension(margin)};
`
