import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { ApiExplorerPage } from '@src/pages/api-explorer/api-explorer'
import { centerContent } from '@src/style/helpers/centerContent'
import { fillContainer } from '@src/style/helpers/fillContainer'
import { stack } from '@src/style/helpers/stack'
import { colors } from '@src/style/theme'
import { css } from 'goober'

const containerStyle = css`
  background: ${colors.bgPrimary.var};
  ${fillContainer};
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

export const App = () => {
  return (
    <div class={containerStyle}>
      <nav>
        <ButtonElement title="API Explorer">
          <Icon name="network" />
        </ButtonElement>
      </nav>

      <main>
        <ApiExplorerPage />
      </main>
    </div>
  )
}
