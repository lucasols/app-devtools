import { removeSensitiveData } from '@src/utils/removeSensitiveData'
import { approxJsonSize } from '@utils/approxJsonSize'
import { concatNonNullable, filterNonNullableElements } from '@utils/arrayUtils'
import { assertIsNotNullish } from '@utils/assertions'
import { createSignalRef } from '@utils/solid'
import { tryExpression } from '@utils/tryExpression'
import { matchURLPattern } from '@utils/urlPattern'
import {
  normalizeUnusedResponseData,
  type UnusedResponseData,
  type UnusedResponseDataInput,
} from '@src/utils/getUnusedResponseData'
import { klona } from 'klona/json'
import { nanoid } from 'nanoid'
import { batch } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { recordingIsPaused } from '@src/stores/recordingStore'

export type {
  UnusedResponseData,
  UnusedResponseDataInput,
} from '@src/utils/getUnusedResponseData'

export type RequestSubTypes =
  | 'delete'
  | 'update'
  | 'create'
  | 'custom'
  | 'send'
  | 'receive'

export type RequestTypes = 'ws' | 'fetch' | 'mutation'

export type RequestStatus = 'pending' | 'success' | 'error'

export type ApiRequest = {
  id: string
  alias?: string
  payload: unknown
  response: unknown
  metadata: unknown
  status: RequestStatus
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
  /**
   * request headers, shown in the request details with values replaced by
   * type descriptions (unless allowed by the `visibleRequestHeaders`
   * config), full values are only used to generate the copy as cURL command
   */
  headers: Record<string, string> | undefined
  /**
   * warnings attached to the request, e.g. deprecated endpoint usage or
   * slow responses, highlighted in the ui like errors are
   */
  warnings: RequestWarning[] | undefined
  /**
   * response fields that were not used by the app, an optimization
   * opportunity shown in the stats tab
   */
  unusedResponseData: UnusedResponseData[] | undefined
  /**
   * approximate stored size (json string length of payload/response/metadata
   * plus a fixed overhead), used by the size-based eviction budget
   */
  approxSize: number
}

export type ApiCall = {
  name: string
  path: string
  type: RequestTypes
  subType?: RequestSubTypes
  lastRequestStartTime: number
  requests: ApiRequest[]
}

export type TimelineMarker = {
  id: string
  label: string
  time: number
}

type State = {
  calls: {
    [callID: string]: ApiCall
  }
  markers: TimelineMarker[]
}

export const [callsStore, setCallsStore] = createStore<State>({
  calls: {},
  markers: [],
})

export function addMarker(label?: string, time?: number) {
  setCallsStore(
    produce((draft) => {
      draft.markers.push({
        id: nanoid(),
        label: label || `Marker ${draft.markers.length + 1}`,
        time: time ?? Date.now(),
      })
    }),
  )
}

export function removeMarker(id: string) {
  setCallsStore(
    produce((draft) => {
      draft.markers = draft.markers.filter((marker) => marker.id !== id)
    }),
  )
}

export function renameMarker(id: string, label: string) {
  setCallsStore(
    'markers',
    (marker) => marker.id === id,
    'label',
    label,
  )
}

export function clearMarkersBefore(time: number) {
  setCallsStore('markers', (markers) =>
    markers.filter((marker) => marker.time >= time),
  )
}

export function clearMarkersAfter(time: number) {
  setCallsStore('markers', (markers) =>
    markers.filter((marker) => marker.time <= time),
  )
}

export function clearHistory() {
  batch(() => {
    setCallsStore({ calls: {}, markers: [] })
    lastAddedCallID.value = ''
  })
}

/** pending requests have no end yet, so they only match "after" clears */
function requestEndTimeOrInfinity(request: ApiRequest): number {
  return request.status === 'pending'
    ? Infinity
    : request.startTime + request.duration
}

function removeRequests(shouldRemove: (request: ApiRequest) => boolean) {
  batch(() => {
    setCallsStore(
      produce((draft) => {
        for (const [callID, call] of Object.entries(draft.calls)) {
          call.requests = call.requests.filter(
            (request) => !shouldRemove(request),
          )

          if (call.requests.length === 0) {
            delete draft.calls[callID]
          }
        }
      }),
    )

    if (!callsStore.calls[lastAddedCallID.value]) {
      lastAddedCallID.value = ''
    }
  })
}

export function clearRequestsBefore(time: number) {
  removeRequests((request) => requestEndTimeOrInfinity(request) < time)
}

export function clearRequestsAfter(time: number) {
  removeRequests((request) => request.startTime > time)
}

export function clearRequestsInRange(start: number, end: number) {
  removeRequests(
    (request) =>
      request.startTime <= end && requestEndTimeOrInfinity(request) >= start,
  )
}

/**
 * returns the request headers safe to show in the ui: values are replaced
 * by type descriptions via `removeSensitiveData`, except for headers
 * explicitly allowed by the `visibleRequestHeaders` config which keep their
 * raw values
 */
export function getDisplayHeaders(
  request: ApiRequest,
): Record<string, unknown> | null {
  if (!request.headers) return null

  const allowedNames = new Set(
    config.visibleRequestHeaders.map((name) => name.toLowerCase()),
  )

  const display: Record<string, unknown> = {}

  for (const [name, value] of Object.entries(request.headers)) {
    display[name] = allowedNames.has(name.toLowerCase())
      ? value
      : removeSensitiveData(value)
  }

  return display
}

/** true if any header value is masked in the ui by `getDisplayHeaders` */
export function requestHasMaskedHeaders(request: ApiRequest): boolean {
  if (!request.headers) return false

  return Object.keys(request.headers).some(
    (name) => !isVisibleRequestHeader(name),
  )
}

/**
 * true if the header raw value can be shown in the ui (allowed by the
 * `visibleRequestHeaders` config)
 */
export function isVisibleRequestHeader(name: string): boolean {
  return config.visibleRequestHeaders.some(
    (allowed) => allowed.toLowerCase() === name.toLowerCase(),
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function normalizeSensitiveFieldName(name: string) {
  return name.toLowerCase().replaceAll('_', '').replaceAll('-', '')
}

/**
 * returns the payload safe to show in the ui: values of fields listed in the
 * `sensitiveDataFields` config (at any nesting level) are replaced by type
 * descriptions via `removeSensitiveData`
 */
export function getDisplayPayload(payload: unknown): {
  value: unknown
  hasMaskedFields: boolean
} {
  const sensitiveNames = new Set(
    config.sensitiveDataFields.map(normalizeSensitiveFieldName),
  )

  if (sensitiveNames.size === 0) {
    return { value: payload, hasMaskedFields: false }
  }

  const maskState = { maskedFields: 0 }

  function mask(value: unknown): unknown {
    if (isArray(value)) {
      return value.map(mask)
    }

    if (isRecord(value)) {
      const masked: Record<string, unknown> = {}

      for (const [key, keyValue] of Object.entries(value)) {
        if (sensitiveNames.has(normalizeSensitiveFieldName(key))) {
          maskState.maskedFields++
          masked[key] = removeSensitiveData(keyValue)
        } else {
          masked[key] = mask(keyValue)
        }
      }

      return masked
    }

    return value
  }

  const value = mask(payload)

  return maskState.maskedFields > 0
    ? { value, hasMaskedFields: true }
    : { value: payload, hasMaskedFields: false }
}

function normalizeHeaders(
  headers: Record<string, string | null | undefined> | undefined,
): Record<string, string> | undefined {
  if (!headers) return undefined

  const normalized: Record<string, string> = {}
  let hasHeaders = false

  for (const [name, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      normalized[name] = value
      hasHeaders = true
    }
  }

  return hasHeaders ? normalized : undefined
}

export type RequestWarning = {
  message: string
  /** optional structured data attached to the warning */
  details?: unknown
}

export type RequestWarningInput = string | RequestWarning | null | undefined

function normalizeWarnings(
  warnings: RequestWarningInput[] | undefined,
): RequestWarning[] | undefined {
  if (!warnings) return undefined

  const normalized: RequestWarning[] = []

  for (const warning of warnings) {
    if (!warning) continue

    if (typeof warning === 'string') {
      normalized.push({ message: warning })
    } else {
      normalized.push({
        message: warning.message,
        details:
          warning.details !== undefined ? klona(warning.details) : undefined,
      })
    }
  }

  return normalized.length > 0 ? normalized : undefined
}

/** accounts for the fixed request fields (path, headers, timings, etc) */
const requestBaseSize = 500

function evictOldRequestsIfNeeded(draft: State) {
  const maxTotalSize = config.maxRequestsSizeMb * 1024 * 1024

  let totalRequests = 0
  let totalSize = 0

  for (const call of Object.values(draft.calls)) {
    totalRequests += call.requests.length

    for (const callRequest of call.requests) {
      totalSize += callRequest.approxSize
    }
  }

  // always keep at least the newest request, even if it alone exceeds the
  // budget
  while (totalSize > maxTotalSize && totalRequests > 1) {
    let oldestCallID: string | null = null
    let oldestStartTime = Infinity

    for (const [callID, call] of Object.entries(draft.calls)) {
      const firstRequest = call.requests[0]

      if (firstRequest && firstRequest.startTime < oldestStartTime) {
        oldestStartTime = firstRequest.startTime
        oldestCallID = callID
      }
    }

    if (!oldestCallID) break

    const oldestCall = draft.calls[oldestCallID]

    assertIsNotNullish(oldestCall)

    const evictedRequest = oldestCall.requests.shift()

    totalRequests--
    totalSize -= evictedRequest ? evictedRequest.approxSize : 0

    if (oldestCall.requests.length === 0) {
      delete draft.calls[oldestCallID]
    }
  }
}

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
  /**
   * request header values are masked in the ui by default (replaced by type
   * descriptions) as they may contain sensitive data, headers listed here
   * (case-insensitive) show their raw values
   */
  visibleRequestHeaders: string[]
  /**
   * payload fields with these names (at any nesting level) have their values
   * masked in the ui (replaced by type descriptions), matching is
   * case-insensitive and ignores `_` and `-` (e.g. `apiKey` also matches
   * `api_key`)
   */
  sensitiveDataFields: string[]
  /**
   * approximate max stored size (in MB, based on json string length) for
   * requests across all call groups, oldest requests are evicted first to
   * avoid memory issues in long-running sessions
   */
  maxRequestsSizeMb: number
}

const defaultSensitiveDataFields = [
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'apiKey',
  'apiSecret',
  'clientSecret',
  'password',
  'secret',
  'authorization',
]

let config: Config = {
  callsProcessor: [],
  visibleRequestHeaders: [],
  sensitiveDataFields: defaultSensitiveDataFields,
  // generous limit to avoid memory issues in long-running sessions
  maxRequestsSizeMb: 30,
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
  /**
   * warnings attached to the request, e.g. deprecated endpoint usage or
   * slow responses, highlighted in the ui like errors are
   */
  warnings?: RequestWarningInput[] | undefined
  /**
   * response fields (e.g. object paths like `user.settings`) that were not
   * used by the app, e.g. fields not declared in the response schema, shown
   * in the stats tab as an optimization opportunity
   */
  unusedResponseData?: UnusedResponseDataInput[] | undefined
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
  /**
   * stable route identifier used to group calls when no calls processor
   * matches; a suffix after `|` distinguishes logical calls while the part
   * before it is used as the route pattern for path parameter extraction
   */
  pathId?: string
  type: RequestTypes
  subType?: RequestSubTypes
  method?: string
  startTime?: number
  duration?: number
  tags?: (string | null | undefined)[]
  warnings?: RequestWarningInput[]
  /**
   * request headers, shown in the request details with values replaced by
   * type descriptions (unless allowed by the `visibleRequestHeaders`
   * config), full values are only used to generate the copy as cURL command
   */
  headers?: Record<string, string | null | undefined>
}): RegisterCallResult {
  if (recordingIsPaused.value) {
    return () => undefined
  }

  const startTime = request.startTime || Date.now()

  const requestID = nanoid()
  let requestCallID: string | null = null

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

      if (!relatedConfig && request.pathId) {
        const pathPattern = request.pathId.split('|')[0]

        if (pathPattern) {
          pathParams = matchURLPattern(pathURL.pathname, pathPattern)
        }
      }

      const normalizedCallId =
        relatedConfig?.callID?.({
          url: pathURL,
          type: request.type,
          subType: request.subType,
        }) ||
        (typeof relatedConfig?.match === 'string' &&
          `${request.type}${request.subType || ''}${relatedConfig.match}`) ||
        (!relatedConfig &&
          request.pathId &&
          `${request.type}${request.subType || ''}${request.pathId}`)

      const callID = btoa(
        normalizedCallId ||
          `${pathURL.pathname}|${request.type}${
            request.subType ? `|${request.subType}` : ''
          }`,
      )

      requestCallID = callID

      const callNameNormalizer = relatedConfig?.callName

      if (!draft.calls[callID]) {
        draft.calls[callID] = {
          name: (
            callNameNormalizer ||
            (typeof relatedConfig?.match === 'string' && relatedConfig.match) ||
            (!relatedConfig && request.pathId) ||
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

      call.lastRequestStartTime = startTime

      const requestToAdd: ApiRequest = {
        id: requestID,
        duration: request.duration || 0,
        pathParams,
        status: 'pending',
        isError: false,
        metadata: undefined,
        response: undefined,
        path: request.path.replace(/^\//, ''),
        payload: klona(request.payload),
        searchParams,
        startTime,
        type: request.type,
        method: request.method,
        subType: request.subType,
        code: undefined,
        tags: filterNonNullableElements(concatNonNullable(request.tags, [])),
        warnings: normalizeWarnings(request.warnings),
        headers: normalizeHeaders(request.headers),
        unusedResponseData: undefined,
        approxSize: requestBaseSize + approxJsonSize(request.payload),
      }

      const payloadAlias = tryExpression(() =>
        relatedConfig?.payloadAlias?.(requestToAdd.payload, requestToAdd),
      )

      if (payloadAlias) {
        requestToAdd.alias = payloadAlias
      }

      call.requests.push(requestToAdd)

      evictOldRequestsIfNeeded(draft)
    }),
  )

  return ({
    isError,
    status,
    response,
    metadata,
    tags,
    warnings,
    unusedResponseData,
  }: {
    isError: boolean
    status?: number
    response: unknown
    metadata?: unknown
    tags?: (string | null | undefined)[]
    warnings?: RequestWarningInput[]
    unusedResponseData?: UnusedResponseDataInput[]
  }) => {
    const duration = request.duration || Date.now() - startTime

    setCallsStore(
      produce((draft) => {
        const call = requestCallID ? draft.calls[requestCallID] : undefined

        // the request may have been evicted or cleared in the meantime
        const pendingRequest = call?.requests.find(
          (callRequest) => callRequest.id === requestID,
        )

        if (!pendingRequest) return

        pendingRequest.status = isError ? 'error' : 'success'
        pendingRequest.isError = isError
        pendingRequest.duration = duration
        pendingRequest.code = status
        pendingRequest.response = klona(response)
        pendingRequest.metadata = klona(metadata)
        pendingRequest.approxSize +=
          approxJsonSize(response) + approxJsonSize(metadata)
        pendingRequest.tags = filterNonNullableElements(
          concatNonNullable(pendingRequest.tags, tags),
        )
        pendingRequest.warnings = normalizeWarnings(
          concatNonNullable(pendingRequest.warnings, warnings),
        )

        if (unusedResponseData) {
          const normalizedUnusedResponseData = normalizeUnusedResponseData(
            unusedResponseData,
          )

          pendingRequest.unusedResponseData = normalizedUnusedResponseData
            ? klona(normalizedUnusedResponseData)
            : undefined
        }

        evictOldRequestsIfNeeded(draft)
      }),
    )
  }
}

if (import.meta.env.DEV) {
  const mockedCalls = await import('@src/mocks/mockedRequests.json')

  // shift the recorded mock timestamps so they end 1 minute before now,
  // keeping their relative spacing
  const lastMockedStartTime = Math.max(
    ...mockedCalls.default.map((call) => call.stats.startTime),
  )
  const mockTimeOffset = Date.now() - lastMockedStartTime - 60_000

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
          startTime: call.stats.startTime + mockTimeOffset,
          duration: call.stats.time,
        })({
          isError: call.response.status >= 400,
          status: call.response.status,
          response: call.response.body,
          metadata: call.metadata,
          warnings: call.request.path.includes('getPlan')
            ? [
                'This endpoint is deprecated, use /v3/org/plan instead',
                'Response is missing the `plan_limits` field',
              ]
            : undefined,
          unusedResponseData: call.request.path.includes('list')
            ? [
                {
                  field: 'data[*].internal_meta',
                },
                {
                  field: 'data[*].legacy_id',
                },
                {
                  field: 'debug_info',
                },
              ]
            : undefined,
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

  setInterval(() => {
    addWebsocketEvent({
      type: 'receive',
      event: 'test',
      response: { ok: true },
    })
  }, 5000)

  // pending request example that never completes
  addCall({
    payload: { example: 'pending' },
    path: '/example/pending-request',
    type: 'fetch',
    method: 'GET',
  })

  // request that stays pending for a while then completes
  setInterval(() => {
    const registerResult = addCall({
      payload: {
        example: 'slow',
        token: 'mock-payload-token-123',
        auth: { access_token: 'mock-access-token-456' },
      },
      path: '/example/slow-request',
      type: 'fetch',
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-secret-token-123',
        'x-trace-id': 'trace_8f2b1c',
        'x-app-version': '1.0.0',
      },
    })

    setTimeout(() => {
      registerResult({
        isError: false,
        status: 200,
        response: { ok: true, slow: true, unused_field: 'not used' },
        warnings: [
          {
            message: 'Response took longer than 3s',
            details: { duration: 4000, threshold: 3000, retries: 0 },
          },
        ],
        unusedResponseData: [
          {
            field: 'unused_field',
            data: 'not used',
          },
        ],
      })
    }, 4000)
  }, 10_000)
}
