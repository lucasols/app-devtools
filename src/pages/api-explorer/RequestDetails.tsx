import ButtonElement from '@src/components/ButtonElement'
import { Section } from '@src/components/Section'
import { ValueVisualizer } from '@src/components/ValueVisualizer'
import { ApiCall, callsStore } from '@src/stores/callsStore'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { setSearchQuery } from '@src/utils/router'
import dayjs from 'dayjs'
import { useLocation } from 'solid-app-router'
import { createMemo } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  ${stack()};
  padding-left: 10px;

  > h1 {
    margin-top: 12px;
    font-family: ${fonts.decorative};
    ${ellipsis};
  }

  > h2 {
    margin-top: 4px;
    font-family: ${fonts.decorative};
    font-size: 12px;
    opacity: 0.5;
  }

  .tags {
    ${inline({ gap: 8 })};
    margin-top: 8px;

    .method {
      color: ${colors.primary.var};
    }

    .code {
      color: ${colors.success.var};

      &.error {
        color: ${colors.error.var};
      }
    }

    .tag {
      font-size: 11px;
      color: ${colors.warning.var};
      padding: 1px 3px;
      border-radius: 4px;
      border: 1px solid ${colors.warning.alpha(0.6)};
    }
  }

  > .details {
    margin-top: 14px;
    padding-right: 10px;
    ${stack({ gap: 8 })};
    flex: 1 1;
    overflow-y: auto;
    padding-bottom: 20px;
  }
`

const tabsStyle = css`
  ${inline({ gap: 20 })};
  color: ${colors.secondary.var};
  margin-top: 20px;

  > button {
    opacity: 0.74;
    padding-bottom: 2px;

    &.selected {
      border-bottom: 2px solid currentColor;
    }

    &.selected,
    &:hover {
      opacity: 1;
    }
  }
`

export const RequestDetails = () => {
  const selectedCallId = $(useLocation().query.callId)
  const selectedRequestId = $(useLocation().query.request)
  const selectedTab = $(useLocation().query.tab || 'summary')

  const selectedRequest = createMemo(() => {
    let selectedCall: ApiCall | undefined

    if (selectedCallId) {
      selectedCall = callsStore.calls[selectedCallId]
    } else {
      selectedCall = Object.values(callsStore.calls).at(-1)
    }

    const selectedRequest = selectedRequestId
      ? selectedCall?.requests.find(
          (request) => request.id === selectedRequestId,
        )
      : selectedCall?.requests.at(-1)

    if (selectedRequest && selectedCall) {
      return {
        ...selectedRequest,
        callName: selectedCall.name,
        callPath: selectedCall.path,
      }
    }

    return null
  })

  function getTab(tabId: string, label: string) {
    return (
      <ButtonElement
        classList={{
          selected: selectedTab === tabId,
        }}
        onClick={() => {
          setSearchQuery({ tab: tabId })
        }}
      >
        {label}
      </ButtonElement>
    )
  }

  return (
    <div class={containerStyle}>
      <Show
        when={selectedRequest()}
        keyed
      >
        {(request) => (
          <>
            <h1>
              {request.callName}
              {request.alias && ` | ${request.alias}`}
            </h1>

            {request.callPath !== request.callName && (
              <h2>{request.callPath}</h2>
            )}

            <div class="tags">
              {request.method && <div class="method">{request.method}</div>}

              {request.code && (
                <div
                  class="code"
                  classList={{
                    error: request.code >= 400,
                  }}
                >
                  {request.code}
                </div>
              )}

              <For each={request.tags}>
                {(tag) => <div class="tag">{tag}</div>}
              </For>
            </div>

            <div class={tabsStyle}>
              {getTab('summary', 'Summary')}
              {!!request.payload && getTab('payload', 'Payload')}
              {!!request.searchParams && getTab('urlParams', 'URL Params')}
              {getTab('response', 'Response')}
            </div>

            <div class="details">
              <Switch>
                <Match when={selectedTab === 'summary'}>
                  {!!request.payload && (
                    <Section title="Payload">
                      <ValueVisualizer
                        value={request.payload}
                        compact
                      />
                    </Section>
                  )}

                  {!!request.searchParams && (
                    <Section title="URL Params">
                      <ValueVisualizer
                        value={request.searchParams}
                        compact
                      />
                    </Section>
                  )}

                  {!!request.response && (
                    <Section title="Response">
                      <ValueVisualizer
                        value={request.response}
                        compact
                      />
                    </Section>
                  )}

                  <Section title="Stats">
                    <ValueVisualizer
                      value={{
                        'Duration (ms)': Math.round(request.duration),
                        'Start Time': `${dayjs(request.startTime).format(
                          'HH:mm:ss',
                        )} (${dayjs(request.startTime).fromNow()})`,
                      }}
                    />
                  </Section>

                  <Section title="Metadata">
                    <ValueVisualizer value={request.metadata} />
                  </Section>
                </Match>

                <Match when={selectedTab === 'payload'}>
                  <Section title={null}>
                    <ValueVisualizer value={request.payload} />
                  </Section>
                </Match>

                <Match when={selectedTab === 'response'}>
                  <Section title={null}>
                    <ValueVisualizer value={request.response} />
                  </Section>
                </Match>

                <Match when={selectedTab === 'urlParams'}>
                  <Section title={null}>
                    <ValueVisualizer value={request.searchParams} />
                  </Section>
                </Match>
              </Switch>
            </div>
          </>
        )}
      </Show>
    </div>
  )
}
