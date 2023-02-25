import { concatNonNullable, filterNonNullableElements } from '@utils/arrayUtils'
import { assertIsNotNullish } from '@utils/assertions'
import { createSignalRef } from '@utils/solid'
import { tryExpression } from '@utils/tryExpression'
import { matchURLPattern } from '@utils/urlPattern'
import { klona } from 'klona/json'
import { nanoid } from 'nanoid'
import { batch } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

export type RequestSubTypes =
  | 'delete'
  | 'update'
  | 'create'
  | 'custom'
  | 'send'
  | 'receive'

export type RequestTypes = 'ws' | 'fetch' | 'mutation'

export type ApiRequest = {
  id: string
  alias?: string
  payload: unknown
  response: unknown
  metadata: unknown
  isError: boolean
  path: string
  searchParams: Record<string, string> | null
  type: RequestTypes
  subType: RequestSubTypes | undefined
  method: string | undefined
  startTime: number
  duration: number
  pathParams: Record<string, string | null> | null
  code: number | undefined
  tags: string[]
}

export type ApiCall = {
  name: string
  path: string
  type: RequestTypes
  subType?: RequestSubTypes
  lastRequestStartTime: number
  requests: ApiRequest[]
}

type State = {
  calls: {
    [callID: string]: ApiCall
  }
}

export const [callsStore, setCallsStore] = createStore<State>({
  calls: {},
})

export const lastAddedCallID = createSignalRef('')

export type Config = {
  callsProcessor: {
    match:
      | ((request: {
          url: URL
          type: RequestTypes
          subType: RequestSubTypes | undefined
        }) => boolean)
      | string
    matchType?: RequestTypes
    matchSubType?: RequestSubTypes[]
    callName?: string
    callID?: (request: {
      url: URL
      type: RequestTypes
      subType?: RequestSubTypes
    }) => string
    payloadAlias?: (payload: any, request: ApiRequest) => string
  }[]
}

let config: Config = {
  callsProcessor: [],
}

export function setConfig(newConfig: Partial<Config>) {
  config = {
    ...config,
    ...newConfig,
  }
}

export type RegisterCallResult = (props: {
  isError: boolean
  status?: number | undefined
  response: unknown
  metadata?: unknown
  tags?: (string | null | undefined)[] | undefined
}) => void

export function addWebsocketEvent({
  type,
  response,
  payload,
  event,
  startTime,
}: {
  type: 'send' | 'receive'
  event: string
  response?: unknown
  payload?: unknown
  startTime?: number
}) {
  const result = addCall({
    type: 'ws',
    path: event,
    payload,
    startTime,
    duration: 0,
    subType: type,
  })

  result({
    isError: false,
    response,
  })
}

export function addCall(request: {
  payload: unknown
  path: string
  type: RequestTypes
  subType?: RequestSubTypes
  method?: string
  startTime?: number
  duration?: number
  tags?: (string | null | undefined)[]
}): RegisterCallResult {
  const startTime = request.startTime || Date.now()

  return ({
    isError,
    status,
    response,
    metadata,
    tags,
  }: {
    isError: boolean
    status?: number
    response: unknown
    metadata?: unknown
    tags?: (string | null | undefined)[]
  }) => {
    const duration = request.duration || Date.now() - startTime

    setCallsStore(
      produce((draft) => {
        const pathURL = tryExpression(
          () => new URL(request.path, 'http://localhost'),
        )

        assertIsNotNullish(pathURL)

        const searchParams =
          pathURL.searchParams.toString() !== ''
            ? Object.fromEntries(pathURL.searchParams.entries())
            : null

        let pathParams: Record<string, string | null> | null = null

        const relatedConfig = config.callsProcessor.find((processor) => {
          if (typeof processor.match === 'string') {
            if (processor.matchType && processor.matchType !== request.type) {
              return false
            }

            if (
              processor.matchSubType &&
              request.subType &&
              processor.matchSubType.includes(request.subType)
            ) {
              return false
            }

            const pattern = matchURLPattern(pathURL.pathname, processor.match)

            if (pattern) {
              pathParams = pattern
              return true
            }

            return false
          } else {
            return processor.match({
              url: pathURL,
              type: request.type,
              subType: request.subType,
            })
          }
        })

        const normalizedCallId =
          relatedConfig?.callID?.({
            url: pathURL,
            type: request.type,
            subType: request.subType,
          }) ||
          (typeof relatedConfig?.match === 'string' &&
            `${request.type}${request.subType || ''}${relatedConfig.match}`)

        const callID = btoa(
          normalizedCallId ||
            `${pathURL.pathname}|${request.type}${
              request.subType ? `|${request.subType}` : ''
            }`,
        )

        const callNameNormalizer = relatedConfig?.callName

        if (!draft.calls[callID]) {
          draft.calls[callID] = {
            name: (
              callNameNormalizer ||
              (typeof relatedConfig?.match === 'string' &&
                relatedConfig.match) ||
              pathURL.pathname
            ).replace(/^\//, ''),
            path: pathURL.pathname.replace(/^\//, ''),
            lastRequestStartTime: startTime,
            requests: [],
            type: request.type,
            subType: request.subType,
          }

          lastAddedCallID.value = callID
        }

        const call = draft.calls[callID]

        assertIsNotNullish(call)

        if (call.requests.length > 100) {
          call.requests.shift()
        }

        const requestToAdd: ApiRequest = {
          id: nanoid(),
          duration,
          pathParams,
          isError,
          metadata: klona(metadata),
          response: klona(response),
          path: request.path.replace(/^\//, ''),
          payload: klona(request.payload),
          searchParams,
          startTime,
          type: request.type,
          method: request.method,
          subType: request.subType,
          code: status,
          tags: filterNonNullableElements(
            concatNonNullable(request.tags, tags),
          ),
        }

        const payloadAlias = tryExpression(() =>
          relatedConfig?.payloadAlias?.(requestToAdd.payload, requestToAdd),
        )

        if (payloadAlias) {
          requestToAdd.alias = payloadAlias
        }

        call.requests.push(requestToAdd)
      }),
    )
  }
}

if (import.meta.env.DEV) {
  const mockedCalls = await import('@src/mocks/mockedRequests.json')

  setTimeout(() => {
    batch(() => {
      mockedCalls.default.forEach((call) => {
        addCall({
          payload: call.request.payload,
          path: call.request.path,
          type:
            call.request.method === 'GET'
              ? 'fetch'
              : call.request.path.includes('update')
              ? 'mutation'
              : 'fetch',
          subType: ((): RequestSubTypes | undefined => {
            if (call.request.path.includes('delete')) {
              return 'delete'
            }

            if (call.request.path.includes('update')) {
              return 'update'
            }

            if (call.request.path.includes('create')) {
              return 'create'
            }

            if (call.request.path.includes('custom')) {
              return 'custom'
            }

            return undefined
          })(),
          method: call.request.method,
          startTime: call.stats.startTime,
          duration: call.stats.time,
        })({
          isError: call.response.status >= 400,
          status: call.response.status,
          response: call.response.body,
          metadata: call.metadata,
        })
      })
    })
  }, 1)

  addWebsocketEvent({
    type: 'send',
    event: 'connect',
    payload: { ok: true },
  })

  addWebsocketEvent({
    type: 'send',
    event: 'connect',
    payload: { ok: true },
  })

  addWebsocketEvent({
    type: 'receive',
    event: 'test',
    response: { ok: true },
  })
  addWebsocketEvent({
    type: 'receive',
    event: 'test',
    response: { ok: true },
  })
}
