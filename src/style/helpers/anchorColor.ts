export function anchorTextColor(color: string) {
  return `
    color: ${color};

    &:visited {
      color: ${color};
    }
  `
}
