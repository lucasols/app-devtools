import { createStore, produce } from 'solid-js/store'
import { nanoid } from 'nanoid'
import { batch } from 'solid-js'
import { assertIsNotNullish } from '@utils/assertions'
import { tryExpression } from '@utils/tryExpression'
import { matchURLPattern } from '@utils/urlPattern'

export type RequestSubTypes = 'delete' | 'update' | 'create' | 'custom'

export type RequestTypes = 'fetch' | 'mutation'

export type ApiRequest = {
  id: string
  alias?: string
  payload: unknown
  response: unknown
  metadata: unknown
  status: number
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

export type Config = {
  callsProcessor: {
    match:
      | ((request: {
          url: URL
          type: RequestTypes
          subType: RequestSubTypes | undefined
        }) => boolean)
      | string
    callName?:
      | ((request: {
          url: URL
          type: RequestTypes
          subType?: RequestSubTypes
        }) => string)
      | string
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

function addCall(request: {
  payload: unknown
  response: unknown
  metadata: unknown
  status: number
  isError: boolean
  path: string
  type: RequestTypes
  subType?: RequestSubTypes
  method?: string
  startTime?: number
  duration?: number
}) {
  const startTime = request.startTime || Date.now()

  return () => {
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
          (typeof relatedConfig?.match === 'string' && relatedConfig.match)

        const callID = btoa(
          normalizedCallId ||
            `${pathURL.pathname}|${request.type}${
              request.subType ? `|${request.subType}` : ''
            }`,
        )

        const callNameNormalizer = relatedConfig?.callName

        const normalizedCallName =
          typeof callNameNormalizer === 'function'
            ? callNameNormalizer({
                url: pathURL,
                type: request.type,
                subType: request.subType,
              })
            : callNameNormalizer

        if (!draft.calls[callID]) {
          draft.calls[callID] = {
            name: normalizedCallName || pathURL.pathname.replace(/^\//, ''),
            path: pathURL.pathname.replace(/^\//, ''),
            lastRequestStartTime: startTime,
            requests: [],
            type: request.type,
            subType: request.subType,
          }
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
          isError: request.isError,
          metadata: request.metadata,
          path: request.path.replace(/^\//, ''),
          payload: request.payload,
          response: request.response,
          searchParams,
          status: request.status,
          startTime,
          type: request.type,
          method: request.method,
          subType: request.subType,
          code: request.status,
          tags: [],
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
          response: call.response.body,
          metadata: call.metadata,
          status: call.response.status,
          isError: call.response.status >= 400,
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
        })()
      })
    })
  }, 1)
}
