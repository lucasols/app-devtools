export function getRegexMatches(string: string, regex: RegExp) {
  const [fullMatch, ...groups] = regex.exec(string) || [undefined];

  return {
    groups,
    fullMatch,
  };
}
