export function multilineEllipsis(breakAtLine: number) {
  return `
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: ${breakAtLine};
    -webkit-box-orient: vertical;
  `
}
