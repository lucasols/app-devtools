import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { unmountApp } from '@src/initializeApp'
import { ApiExplorerPage } from '@src/pages/api-explorer/api-explorer'
import { globalStyle } from '@src/style/globalStyle'
import { centerContent } from '@src/style/helpers/centerContent'
import { fillContainer } from '@src/style/helpers/fillContainer'
import { stack } from '@src/style/helpers/stack'
import { resetStyle } from '@src/style/reset'
import { colors } from '@src/style/theme'
import { css } from 'solid-styled-components'

const containerStyle = css`
  ${resetStyle};
  ${globalStyle};

  position: fixed;
  inset: 32px;
  border-radius: 4px;
  background: ${colors.bgPrimary.var};
  display: grid;
  grid-template-columns: 51px 1fr;

  nav {
    ${stack()};
    border-right: 1px solid ${colors.white.alpha(0.1)};

    button {
      ${centerContent};
      width: 100%;
      aspect-ratio: 1 / 1;
      color: ${colors.bgPrimary.var};
      --icon-size: 30px;

      &::before {
        content: '';
        inset: 6px;
        border-radius: 3px;
        position: absolute;
        background: ${colors.primary.var};
      }
    }
  }

  > main > * {
    ${fillContainer};
  }
`

const backdropStyle = css`
  ${fillContainer};
  position: fixed;
  inset: 0;
  backdrop-filter: blur(5px);
`

export const App = () => {
  return (
    <>
      <div
        class={backdropStyle}
        onClick={unmountApp}
      />
      <div
        class={containerStyle}
        id="dev-tools-root-element"
      >
        <nav>
          <ButtonElement title="API Explorer">
            <Icon name="network" />
          </ButtonElement>
        </nav>

        <main>
          <ApiExplorerPage />
        </main>
      </div>
    </>
  )
}
