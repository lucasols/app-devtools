export function parseUnit(
  value: string | number | number[],
  defaultUnit = 'px',
) {
  return typeof value === 'string'
    ? String(value)
    : Array.isArray(value)
    ? value.map((item) => `${item}${defaultUnit}`).join(' ')
    : `${value}${defaultUnit}`;
}
