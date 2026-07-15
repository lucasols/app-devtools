import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { ErrorBoundary, JSX } from 'solid-js'
import { css } from 'solid-styled-components'

const fallbackStyle = css`
  &&& {
    ${stack({ align: 'center', justify: 'center', gap: 10 })};
    height: 100%;
    padding: 32px;
    text-align: center;

    > .icon {
      color: ${colors.error.var};
      --icon-size: 28px;
    }

    > h1 {
      color: ${colors.error.var};
      font-family: ${fonts.decorative};
      font-size: 16px;
    }

    > p {
      max-width: 560px;
      color: ${colors.white.alpha(0.65)};
      font-size: 13px;
    }

    > pre {
      max-width: min(680px, 100%);
      max-height: 180px;
      overflow: auto;
      border-radius: 4px;
      padding: 8px 10px;
      color: ${colors.white.alpha(0.65)};
      background: ${colors.white.alpha(0.05)};
      font-family: ${fonts.decorative};
      font-size: 11px;
      text-align: left;
      white-space: pre-wrap;
      user-select: text;
    }

    > button {
      margin-top: 4px;
      padding: 6px 12px;
      border-radius: 4px;
      color: ${colors.bgPrimary.var};
      background: ${colors.primary.var};
      font-size: 13px;
      font-weight: 600;

      &:hover {
        background: ${colors.secondary.var};
      }
    }
  }
`

function getErrorDetails(value: unknown): string {
  if (value instanceof globalThis.Error) {
    return value.stack || value.message
  }

  if (typeof value === 'string') return value

  return 'Unknown rendering error'
}

const PageErrorFallback = (props: {
  error: unknown
  onRetry: () => void
}) => {
  return (
    <div class={fallbackStyle}>
      <Icon name="alert-triangle" />
      <h1>This devtools page crashed</h1>
      <p>
        The error was isolated from the rest of the devtools. Retry after the
        underlying state changes, or open another page from the sidebar.
      </p>
      <pre>{getErrorDetails(props.error)}</pre>
      <ButtonElement onClick={props.onRetry}>Retry</ButtonElement>
    </div>
  )
}

export const DevtoolsPageErrorBoundary = (props: {
  children: JSX.Element
}) => {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <PageErrorFallback
          error={error}
          onRetry={reset}
        />
      )}
    >
      {props.children}
    </ErrorBoundary>
  )
}
