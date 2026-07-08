import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { JsonViewer } from '@src/components/JsonViewer/JsonViewer'
import { createResizablePanels } from '@src/components/resizablePanels'
import Select from '@src/components/Select'
import {
  CallerResultEntry,
  defaultCallerInputs,
  defaultCallerMethods,
  getJsonValidationError,
  inputValuesMatch,
  loadRequestIntoForm,
  requestCallerStore,
  resolveInputValues,
  sendCallerRequest,
  setRequestCallerStore,
} from '@src/stores/requestCallerStore'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import dayjs from 'dayjs'
import { createMemo } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    display: grid;
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

      &.selected {
        background: ${colors.secondary.alpha(0.12)};
      }

      .method-row {
        ${inline({ gap: 6 })};
        max-width: 100%;
      }

      .method {
        font-size: 11px;
        font-family: ${fonts.decorative};
        color: ${colors.primary.var};
      }

      .sender {
        ${ellipsis};
        font-size: 11px;
        color: ${colors.secondary.alpha(0.8)};
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
    padding: 12px 16px 0;
    gap: 12px;
    overflow: hidden;

    .form-row {
      ${inline({ gap: 8 })};
      flex-shrink: 0;
    }

    .caller-select,
    .method-select {
      width: 150px;
      flex-shrink: 0;
    }

    .input-select {
      width: 220px;
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

    input.text-input {
      height: 32px;
      font-family: ${fonts.decorative};
      font-size: 13px;
      flex-shrink: 0;
    }

    textarea {
      font-family: ${fonts.decorative};
      font-size: 13px;
      min-height: 120px;
      resize: vertical;
      flex-shrink: 0;

      &.invalid {
        border-color: ${colors.error.alpha(0.6)};
      }
    }

    .input-error {
      color: ${colors.error.var};
      font-size: 12px;
      margin-top: -6px;
      flex-shrink: 0;
    }

    .input-label {
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

const resultsSectionStyle = css`
  &&& {
    display: grid;
    flex: 1 1 0;
    min-height: 0;
    margin: 0 -16px;
    border-top: 1px solid ${colors.white.alpha(0.1)};

    .results-list {
      ${stack({ align: 'stretch' })};
      overflow: hidden;
      border-right: 1px solid ${colors.white.alpha(0.1)};

      > .title {
        font-size: 12px;
        color: ${colors.secondary.var};
        padding: 10px 12px 6px;
        flex-shrink: 0;
      }

      > .entries {
        ${stack({ align: 'stretch' })};
        flex: 1 1;
        overflow-y: auto;
      }

      .result-row {
        ${stack({ align: 'left' })};
        gap: 2px;
        padding: 6px 12px;
        width: 100%;
        text-align: left;
        font-size: 12px;
        font-family: ${fonts.decorative};

        &:hover {
          background: ${colors.white.alpha(0.05)};
        }

        &.selected {
          background: ${colors.secondary.alpha(0.12)};
        }

        .row-meta {
          ${inline({ gap: 8 })};
          max-width: 100%;

          .time {
            opacity: 0.6;
          }
        }

        .row-sender {
          ${ellipsis};
          max-width: 100%;
          font-size: 11px;
          color: ${colors.secondary.alpha(0.8)};
        }
      }
    }

    .status {
      color: ${colors.success.var};

      &.error {
        color: ${colors.error.var};
      }
    }

    .result-detail {
      ${stack({ align: 'stretch' })};
      gap: 10px;
      padding: 10px 16px 12px;
      overflow-y: auto;

      .detail-header {
        ${inline({ gap: 8 })};
        flex-shrink: 0;
        font-family: ${fonts.decorative};
        font-size: 13px;

        .method {
          color: ${colors.primary.var};
          font-size: 12px;
          flex-shrink: 0;
        }

        .path {
          ${ellipsis};
          flex: 1 1;
        }

        .modify-button {
          ${inline({ gap: 4 })};
          flex-shrink: 0;
          font-size: 12px;
          font-family: ${fonts.decorative};
          color: ${colors.secondary.var};
          border: 1px solid ${colors.secondary.alpha(0.4)};
          border-radius: 4px;
          padding: 3px 10px;
          --icon-size: 13px;

          &:hover {
            background: ${colors.secondary.alpha(0.15)};
          }
        }
      }

      .detail-meta {
        ${inline({ gap: 12 })};
        flex-shrink: 0;
        font-size: 13px;
        font-family: ${fonts.decorative};

        .sender {
          color: ${colors.secondary.alpha(0.8)};
        }

        .time {
          opacity: 0.6;
        }
      }

      .detail-label {
        font-size: 12px;
        color: ${colors.secondary.var};
        margin-bottom: -4px;
        flex-shrink: 0;
      }

      .input-value {
        font-family: ${fonts.decorative};
        font-size: 12px;
        opacity: 0.8;
        white-space: pre-wrap;
        word-break: break-word;
        background: ${colors.white.alpha(0.04)};
        border-radius: 4px;
        padding: 8px 10px;
        flex-shrink: 0;
      }

      .result-error {
        color: ${colors.error.var};
        font-size: 13px;
        white-space: pre-wrap;
      }
    }
  }
`

export const CallerPage = () => {
  const selectedCaller = createMemo(
    () => requestCallerStore.callers[requestCallerStore.selectedCallerIdx],
  )

  const methods = $(selectedCaller()?.methods || defaultCallerMethods)

  const inputs = createMemo(
    () => selectedCaller()?.inputs ?? defaultCallerInputs,
  )

  const panels = createResizablePanels({
    storageKey: 'caller',
    initialSizes: [1, 4],
  })

  const resultPanels = createResizablePanels({
    storageKey: 'caller-results',
    initialSizes: [1, 2.5],
  })

  const inputsError = createMemo(() => {
    for (const input of inputs()) {
      if (input.type === 'json') {
        const jsonError = getJsonValidationError(
          requestCallerStore.inputValues[input.name] ?? '',
        )

        if (jsonError) return jsonError
      }
    }

    return null
  })

  // results of the request currently loaded in the form
  const currentRequestResults = createMemo(() => {
    const path = requestCallerStore.path.trim()
    const method = requestCallerStore.method

    return requestCallerStore.resultsHistory.filter(
      (entry) => entry.path === path && entry.method === method,
    )
  })

  // history entry matching the request currently loaded in the form
  const selectedHistoryEntryId = createMemo(() => {
    const path = requestCallerStore.path.trim()
    const method = requestCallerStore.method
    const callerName = selectedCaller()?.name
    const formValues = resolveInputValues(inputs())

    return requestCallerStore.history.find(
      (entry) =>
        entry.path === path &&
        entry.method === method &&
        (!entry.callerName || entry.callerName === callerName) &&
        inputValuesMatch(entry.inputValues, formValues),
    )?.id
  })

  const selectedResult = createMemo(() => {
    const results = currentRequestResults()

    return (
      results.find(
        (entry) => entry.id === requestCallerStore.selectedResultId,
      ) ?? results[0]
    )
  })

  return (
    <div
      class={containerStyle}
      style={{ 'grid-template-columns': panels.gridTemplateColumns() }}
    >
      <div class={historyStyle}>
        <h1>history</h1>

        <div class="entries">
          <For
            each={requestCallerStore.history}
            fallback={<div class="empty">no requests sent yet</div>}
          >
            {(entry) => (
              <ButtonElement
                classList={{ selected: entry.id === selectedHistoryEntryId() }}
                onClick={() => {
                  loadRequestIntoForm(entry)
                }}
              >
                <span class="method-row">
                  <span class="method">{entry.method}</span>
                  <Show when={entry.callerName}>
                    <span class="sender">{entry.callerName}</span>
                  </Show>
                </span>
                <span class="path">{entry.path}</span>
              </ButtonElement>
            )}
          </For>
        </div>
      </div>

      <panels.Handle index={0} />

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
                  setRequestCallerStore({
                    path: e.currentTarget.value,
                    sendError: null,
                  })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void sendCallerRequest()
                  }
                }}
              />

              <ButtonElement
                class="send-button"
                disabled={requestCallerStore.isLoading || !!inputsError()}
                onClick={() => {
                  void sendCallerRequest()
                }}
              >
                <Icon name="play" />
                {requestCallerStore.isLoading ? 'Sending…' : 'Send'}
              </ButtonElement>
            </div>

            <For each={inputs()}>
              {(input) => {
                const value = () =>
                  requestCallerStore.inputValues[input.name] ?? ''

                function setValue(newValue: string) {
                  setRequestCallerStore('inputValues', input.name, newValue)
                }

                if (input.type === 'select') {
                  return (
                    <>
                      <div class="input-label">{input.label ?? input.name}</div>

                      <Select
                        class="input-select"
                        value={
                          value() ||
                          (typeof input.options[0] === 'string'
                            ? input.options[0]
                            : input.options[0]?.value) ||
                          ''
                        }
                        options={input.options.map((option) =>
                          typeof option === 'string'
                            ? { value: option, label: option }
                            : option,
                        )}
                        onChange={setValue}
                      />
                    </>
                  )
                }

                if (input.type === 'string') {
                  return (
                    <>
                      <div class="input-label">{input.label ?? input.name}</div>

                      <input
                        class="text-input"
                        placeholder={input.placeholder}
                        value={value()}
                        onInput={(e) => {
                          setValue(e.currentTarget.value)
                        }}
                      />
                    </>
                  )
                }

                const jsonError = createMemo(() =>
                  getJsonValidationError(value()),
                )

                return (
                  <>
                    <div class="input-label">
                      {input.label ?? `${input.name} (json)`}
                    </div>

                    <textarea
                      placeholder={input.placeholder ?? '{ }'}
                      classList={{ invalid: !!jsonError() }}
                      value={value()}
                      onInput={(e) => {
                        setValue(e.currentTarget.value)
                      }}
                    />

                    <Show when={jsonError()}>
                      <div class="input-error">{jsonError()}</div>
                    </Show>
                  </>
                )
              }}
            </For>

            <Show when={requestCallerStore.sendError}>
              <div class="input-error">{requestCallerStore.sendError}</div>
            </Show>

            <Show when={currentRequestResults().length > 0}>
              <div
                class={resultsSectionStyle}
                style={{
                  'grid-template-columns': resultPanels.gridTemplateColumns(),
                }}
              >
                <div class="results-list">
                  <div class="title">results</div>

                  <div class="entries">
                    <For each={currentRequestResults()}>
                      {(entry) => (
                        <ButtonElement
                          class="result-row"
                          classList={{
                            selected: entry.id === selectedResult()?.id,
                          }}
                          onClick={() => {
                            setRequestCallerStore('selectedResultId', entry.id)
                          }}
                        >
                          <span class="row-meta">
                            <span
                              class="status"
                              classList={{ error: entry.isError }}
                            >
                              {entry.isError ? 'error' : 'success'}
                              {entry.status !== undefined &&
                                ` · ${entry.status}`}
                            </span>

                            <span>{entry.duration} ms</span>

                            <span
                              class="time"
                              title={dayjs(entry.startTime).format(
                                'YYYY-MM-DD HH:mm:ss',
                              )}
                            >
                              {dayjs(entry.startTime).fromNow()}
                            </span>
                          </span>

                          <Show when={entry.callerName}>
                            <span class="row-sender">
                              via {entry.callerName}
                            </span>
                          </Show>
                        </ButtonElement>
                      )}
                    </For>
                  </div>
                </div>

                <resultPanels.Handle index={0} />

                <Show
                  when={selectedResult()}
                  keyed
                >
                  {(result) => <ResultDetail result={result} />}
                </Show>
              </div>
            </Show>
          </>
        )}
      </div>
    </div>
  )
}

const ResultDetail = (props: { result: CallerResultEntry }) => {
  const sentInputValues = createMemo(() =>
    Object.entries(props.result.inputValues).filter(
      ([, value]) => value !== '',
    ),
  )

  return (
    <div class="result-detail">
      <div class="detail-header">
        <span class="method">{props.result.method}</span>
        <span
          class="path"
          title={props.result.path}
        >
          {props.result.path}
        </span>

        <ButtonElement
          class="modify-button"
          title="Load this request into the form"
          onClick={() => {
            loadRequestIntoForm(props.result)
          }}
        >
          modify
        </ButtonElement>
      </div>

      <div class="detail-meta">
        <span
          class="status"
          classList={{ error: props.result.isError }}
        >
          {props.result.isError ? 'error' : 'success'}
          {props.result.status !== undefined && ` · ${props.result.status}`}
        </span>

        <span>{props.result.duration} ms</span>

        <Show when={props.result.callerName}>
          <span class="sender">via {props.result.callerName}</span>
        </Show>

        <span class="time">
          {dayjs(props.result.startTime).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      </div>

      <For each={sentInputValues()}>
        {([name, value]) => (
          <>
            <div class="detail-label">{name} sent</div>
            <pre class="input-value">{value}</pre>
          </>
        )}
      </For>

      <div class="detail-label">response</div>

      {props.result.error !== null ? (
        <div class="result-error">{props.result.error}</div>
      ) : (
        <JsonViewer
          value={props.result.response}
          search
        />
      )}
    </div>
  )
}
