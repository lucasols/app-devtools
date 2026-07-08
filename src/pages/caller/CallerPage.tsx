import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { JsonViewer } from '@src/components/JsonViewer/JsonViewer'
import Select from '@src/components/Select'
import {
  defaultCallerMethods,
  requestCallerStore,
  sendCallerRequest,
  setRequestCallerStore,
} from '@src/stores/requestCallerStore'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { createMemo } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    display: grid;
    grid-template-columns: 240px 1fr;
    overflow: hidden;
  }
`

const historyStyle = css`
  &&& {
    ${stack()};
    border-right: 1px solid ${colors.white.alpha(0.1)};
    overflow: hidden;

    > h1 {
      font-size: 16px;
      padding: 10px 12px 16px;
      font-family: ${fonts.decorative};
      color: ${colors.secondary.var};
    }

    > .entries {
      ${stack()};
      flex: 1 1;
      overflow-y: auto;
    }

    .empty {
      opacity: 0.4;
      font-size: 13px;
      padding: 0 12px;
    }

    button {
      ${stack({ align: 'left' })};
      padding: 6px 12px;
      gap: 2px;
      width: 100%;
      text-align: left;

      &:hover {
        background: ${colors.white.alpha(0.05)};
      }

      .method {
        font-size: 11px;
        font-family: ${fonts.decorative};
        color: ${colors.primary.var};
      }

      .path {
        ${ellipsis};
        font-size: 13px;
        max-width: 100%;
      }
    }
  }
`

const mainStyle = css`
  &&& {
    ${stack({ align: 'stretch' })};
    padding: 12px 16px;
    gap: 12px;
    overflow-y: auto;

    .form-row {
      ${inline({ gap: 8 })};
      flex-shrink: 0;
    }

    .caller-select,
    .method-select {
      width: 150px;
      flex-shrink: 0;
    }

    input,
    textarea {
      background: ${colors.white.alpha(0.05)};
      border: 1px solid ${colors.white.alpha(0.08)};
      border-radius: 4px;
      color: ${colors.white.var};
      font-size: 14px;
      padding: 6px 10px;

      &:focus {
        outline: 0;
        border-color: ${colors.secondary.alpha(0.6)};
      }
    }

    input.path-input {
      flex: 1 1;
      height: 32px;
      font-family: ${fonts.decorative};
      font-size: 13px;
    }

    textarea {
      font-family: ${fonts.decorative};
      font-size: 13px;
      min-height: 120px;
      resize: vertical;
      flex-shrink: 0;
    }

    .payload-label {
      font-size: 12px;
      color: ${colors.secondary.var};
      margin-bottom: -6px;
      flex-shrink: 0;
    }

    .send-button {
      ${inline({ gap: 6, justify: 'center' })};
      background: ${colors.primary.var};
      color: ${colors.bgPrimary.var};
      font-weight: 600;
      font-size: 14px;
      border-radius: 4px;
      padding: 0 18px;
      height: 32px;
      flex-shrink: 0;
      --icon-size: 16px;

      &:disabled {
        opacity: 0.5;
      }
    }

    .result-meta {
      ${inline({ gap: 12 })};
      font-size: 13px;
      font-family: ${fonts.decorative};
      flex-shrink: 0;

      .status {
        color: ${colors.success.var};

        &.error {
          color: ${colors.error.var};
        }
      }
    }

    .result-error {
      color: ${colors.error.var};
      font-size: 13px;
      white-space: pre-wrap;
      flex-shrink: 0;
    }

    .empty-state {
      ${stack({ align: 'center' })};
      padding-top: 60px;
      gap: 8px;
      opacity: 0.6;
      text-align: center;

      code {
        font-family: ${fonts.decorative};
        color: ${colors.secondary.var};
      }
    }
  }
`

export const CallerPage = () => {
  const selectedCaller = createMemo(
    () => requestCallerStore.callers[requestCallerStore.selectedCallerIdx],
  )

  const methods = $(selectedCaller()?.methods || defaultCallerMethods)

  return (
    <div class={containerStyle}>
      <div class={historyStyle}>
        <h1>history</h1>

        <div class="entries">
          <For
            each={requestCallerStore.history}
            fallback={<div class="empty">no requests sent yet</div>}
          >
            {(entry) => (
              <ButtonElement
                onClick={() => {
                  setRequestCallerStore({
                    path: entry.path,
                    method: entry.method,
                    payloadText: entry.payloadText,
                  })
                }}
              >
                <span class="method">{entry.method}</span>
                <span class="path">{entry.path}</span>
              </ButtonElement>
            )}
          </For>
        </div>
      </div>

      <div class={mainStyle}>
        {requestCallerStore.callers.length === 0 ? (
          <div class="empty-state">
            <div>No request callers configured.</div>
            <div>
              Pass a <code>requestCallers</code> array to{' '}
              <code>initializeDevTools()</code> to enable calling requests from
              here using your app data fetching mechanisms.
            </div>
          </div>
        ) : (
          <>
            <div class="form-row">
              {requestCallerStore.callers.length > 1 && (
                <Select
                  class="caller-select"
                  value={String(requestCallerStore.selectedCallerIdx)}
                  options={requestCallerStore.callers.map((caller, idx) => ({
                    value: String(idx),
                    label: caller.name,
                  }))}
                  onChange={(value) => {
                    setRequestCallerStore('selectedCallerIdx', Number(value))
                  }}
                />
              )}

              <Select
                class="method-select"
                value={requestCallerStore.method}
                options={methods.map((method) => ({
                  value: method,
                  label: method,
                }))}
                onChange={(value) => {
                  setRequestCallerStore('method', value)
                }}
              />

              <input
                class="path-input"
                placeholder="request path, e.g. /v3/tables"
                value={requestCallerStore.path}
                onInput={(e) => {
                  setRequestCallerStore('path', e.currentTarget.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void sendCallerRequest()
                  }
                }}
              />

              <ButtonElement
                class="send-button"
                disabled={requestCallerStore.isLoading}
                onClick={() => {
                  void sendCallerRequest()
                }}
              >
                <Icon name="play" />
                {requestCallerStore.isLoading ? 'Sending…' : 'Send'}
              </ButtonElement>
            </div>

            <div class="payload-label">payload (json)</div>

            <textarea
              placeholder="{ }"
              value={requestCallerStore.payloadText}
              onInput={(e) => {
                setRequestCallerStore('payloadText', e.currentTarget.value)
              }}
            />

            <Show
              when={requestCallerStore.lastResult}
              keyed
            >
              {(result) => (
                <>
                  <div class="result-meta">
                    <span
                      class="status"
                      classList={{ error: result.isError }}
                    >
                      {result.isError ? 'error' : 'success'}
                      {result.status !== undefined && ` · ${result.status}`}
                    </span>

                    <span>{result.duration} ms</span>
                  </div>

                  {result.error !== null ? (
                    <div class="result-error">{result.error}</div>
                  ) : (
                    <JsonViewer
                      value={result.response}
                      search
                    />
                  )}
                </>
              )}
            </Show>
          </>
        )}
      </div>
    </div>
  )
}
