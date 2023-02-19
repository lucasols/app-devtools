export function gradientText(gradient: string) {
  return `
    background: ${gradient};
    color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
  `
}
