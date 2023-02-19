import { parseUnit } from '@utils/parseUnit'

export const outline = (size: number | string, color: string) => `
  box-shadow: 0 0 0 ${parseUnit(size)} ${color};
`
