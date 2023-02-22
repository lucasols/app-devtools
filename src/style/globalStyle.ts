import { colors, fonts } from '@src/style/theme'

export const globalStyle = `
  font-family: ${fonts.primary};
  color: ${colors.textPrimary.var};

  * {
    user-select: none;
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }

  input,
  textarea,
  p,
  pre,
  h1,
  h2 {
    user-select: text;
  }

  :is(input, textarea, p, pre, h1, h2) * {
    user-select: text;
  }

  a {
    --anchor-color: inherit;
    color: var(---anchor-color);
  }

  a:visited {
    color: var(---anchor-color);
  }

  button {
    color: inherit;
  }

  p,
  h1,
  h2,
  h3 {
    font-size: inherit;
  }

  h1 {
    font-weight: normal;
  }

  h2,
  h3 {
    font-weight: normal;
  }
`
