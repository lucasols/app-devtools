import { centerContent } from '@src/style/helpers/centerContent'
import { scrollBarStyle } from '@src/style/scrollBar'
import { colors, fonts } from '@src/style/theme'
import { createGlobalStyles } from 'solid-styled-components'

export const GlobalStyles = () => {
  const Styles = createGlobalStyles`
    #app,
    body,
    html {
      position: absolute;
      height: 100%;
      width: 100%;
      overflow: hidden;
      padding: 0;
      margin: 0;
      background: #EAEFFF;
      font-family: ${fonts.primary};
      color: ${colors.textPrimary.var};
    }

    #app {
      z-index: 0;
    }

    body {
      ${centerContent};
    }

    #modals,
    #alerts,
    #popover {
      position: relative;
      z-index: 0;
    }

    #modals {
      width: 100%;
      height: 100%;
      pointer-events: none;
      ${centerContent};

      > div {
        position: absolute;
        width: 100%;
        height: 100%;

        > * {
          pointer-events: auto;
        }
      }
    }

    * {
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    input,
    textarea,
    p,
    pre,
    h1,
    h2 {
      user-select: text;

      * {
        user-select: text;
      }
    }

    a {
      --anchor-color: inherit;
      color: var(---anchor-color);

      &:visited {
        color: var(---anchor-color);
      }
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

    .firebase-emulator-warning {
      display: none;
    }

    ${scrollBarStyle};
  `
  return <Styles />
}
