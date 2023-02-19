export function gradientBorder({
  gradient,
  background,
  borderSize = 1,
  borderOpacity = 0,
}: {
  gradient: string
  background: string
  borderSize?: number
  borderOpacity?: number
}) {
  return `
    position: relative;
    isolation: isolate;
    background: ${gradient};

    &::before {
      content: '';
      inset: 0;
      border-radius: inherit;
      z-index: -1;
      border: ${borderSize}px solid rgba(0, 0, 0, ${borderOpacity});
      background: ${background};
      position: absolute;
      background-clip: padding-box;
    }
  `
}
