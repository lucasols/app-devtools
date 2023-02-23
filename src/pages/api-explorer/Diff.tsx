import { Section } from '@src/components/Section'
import Select from '@src/components/Select'
import { getRequestPayload } from '@src/pages/api-explorer/getRequestPayload'
import { ApiRequest, callsStore } from '@src/stores/callsStore'
import { uiStore } from '@src/stores/uiStore'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { reverseCopy } from '@utils/arrayUtils'
import { getDiff } from '@utils/getDiff'
import { createReconciledArray, createSignalRef } from '@utils/solid'
import { truncateText } from '@utils/truncateText'
import dayjs from 'dayjs'
import { createMemo } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    ${stack({ gap: 14 })};

    .changes-count {
      color: ${colors.white.alpha(0.5)};
      font-size: 14px;

      .additions {
        color: ${colors.success.var};
      }

      .removals {
        color: ${colors.error.var};
      }
    }
  }
`

const diffContainerStyle = css`
  &&& {
    ${stack({ gap: 0 })};
    font-size: 14px;
    font-family: ${fonts.decorative};
    white-space: pre;
    overflow-x: auto;

    .line {
      opacity: 0.7;
      padding-left: 10px;

      &.added {
        opacity: 1;
        color: ${colors.success.var};
        background: ${colors.success.alpha(0.1)};

        &::before {
          content: '+';
          position: absolute;
          left: 0;
        }
      }

      &.removed {
        opacity: 1;
        color: ${colors.error.var};
        background: ${colors.error.alpha(0.1)};

        &::before {
          content: '-';
          position: absolute;
          left: 0;
        }
      }
    }
  }
`

export const Diff = () => {
  const currentCall = createMemo(() => {
    const { selectedCall } = uiStore

    if (!selectedCall) return Object.values(callsStore.calls).at(-1)

    return callsStore.calls[selectedCall]
  })

  const activeRequest = createMemo(() => {
    if (!uiStore.selectedRequest) return currentCall()?.requests.at(-1) || null

    return currentCall()?.requests.find(
      (request) => request.id === uiStore.selectedRequest,
    )
  })

  const activeRequestId = $(activeRequest()?.id)

  const requestOptions = createReconciledArray(() => {
    const call = currentCall()

    if (!call) return []

    return reverseCopy(call.requests)
      .map((request) => {
        return {
          value: request.id,
          label: `${dayjs(request.startTime).format(
            'HH:mm:ss',
          )} | ${truncateText(getRequestPayload(request), 50)}`,
        }
      })
      .filter((request) => request.value !== activeRequestId)
  }, 'value')

  const compareRequest = createSignalRef<null | string>(null)

  const compareFromRequest = createMemo(() => {
    if (!compareRequest.value) return null

    return currentCall()?.requests.find(
      (request) => request.id === compareRequest.value,
    )
  })

  const responseDiff = createMemo(() => {
    if (!compareRequest.value || !activeRequestId) return []

    const activeResponse = activeRequest()?.response

    const compareFromResponse = compareFromRequest()?.response

    const diffParts = getDiff(compareFromResponse, activeResponse)

    return diffParts === 'no changes' ? [] : diffParts
  })

  const payloadDiff = createMemo(() => {
    if (!compareRequest.value || !activeRequestId) return []

    const activePayload = getPayload(activeRequest())

    const compareFromPayload = getPayload(compareFromRequest())

    const diffParts = getDiff(compareFromPayload, activePayload)

    return diffParts === 'no changes' ? [] : diffParts
  })

  return (
    <div class={containerStyle}>
      <Select
        value={compareRequest.value}
        label="Select a request to compare with"
        options={requestOptions()}
        onChange={(value) => {
          compareRequest.value = value
        }}
      />

      <Show when={compareRequest.value}>
        <div class="changes-count">
          <span class="additions">
            + <b>{responseDiff().filter((item) => item.added).length}</b> lines
          </span>{' '}
          |{' '}
          <span class="removals">
            - <b>{responseDiff().filter((item) => item.removed).length}</b>{' '}
            lines
          </span>
        </div>

        <Section
          title={
            activeRequest()?.payload
              ? 'Payload Diff'
              : activeRequest()?.searchParams
              ? 'Search Params Diff'
              : 'Path Params Diff'
          }
        >
          <div class={diffContainerStyle}>
            <For
              each={payloadDiff()}
              fallback={<div>No changes</div>}
            >
              {(item) => (
                <div
                  class="line"
                  classList={{
                    added: item.added,
                    removed: item.removed,
                  }}
                >
                  {item.value}
                </div>
              )}
            </For>
          </div>
        </Section>

        <Section title={'Response Diff'}>
          <div class={diffContainerStyle}>
            <For
              each={responseDiff()}
              fallback={<div>No changes</div>}
            >
              {(item) => (
                <div
                  class="line"
                  classList={{
                    added: item.added,
                    removed: item.removed,
                  }}
                >
                  {item.value}
                </div>
              )}
            </For>
          </div>
        </Section>
      </Show>
    </div>
  )
}

function getPayload(request: ApiRequest | undefined | null) {
  if (!request) return null

  return request.payload || request.searchParams || request.pathParams
}
