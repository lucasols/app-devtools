export function hexToRgb(hex: string) {
  if (hex.length < 4) throw new Error('Invalid hex value');

  return (
    hex
      .replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (m: string, r: string, g: string, b: string) =>
          `#${r}${r}${g}${g}${b}${b}`,
      )
      .substring(1)
      .match(/.{2}/g) || []
  ).map((x: string) => parseInt(x, 16));
}
