import {
  ApiRequest,
  getDisplayPayload,
  isVisibleRequestHeader,
} from '@src/stores/callsStore'

function shellEscape(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`
}

export function getRequestAsCurl(
  request: ApiRequest,
  options: {
    /**
     * replaces sensitive header values with a `<masked>` placeholder and
     * sensitive payload field values with type descriptions
     */
    maskSensitiveData?: boolean
  } = {},
): string {
  const url =
    request.path.startsWith('http://') || request.path.startsWith('https://')
      ? request.path
      : `${window.location.origin}/${request.path}`

  const method =
    request.method?.toUpperCase() ||
    (request.payload !== undefined && request.payload !== null
      ? 'POST'
      : 'GET')

  const parts = [`curl ${shellEscape(url)}`]

  if (method !== 'GET') {
    parts.push(`-X ${method}`)
  }

  const headers = Object.entries(request.headers || {})

  for (const [name, value] of headers) {
    const headerValue =
      options.maskSensitiveData && !isVisibleRequestHeader(name)
        ? '<masked>'
        : value

    parts.push(`-H ${shellEscape(`${name}: ${headerValue}`)}`)
  }

  if (
    request.payload !== undefined &&
    request.payload !== null &&
    method !== 'GET'
  ) {
    const hasContentType = headers.some(
      ([name]) => name.toLowerCase() === 'content-type',
    )

    if (!hasContentType) {
      parts.push(`-H ${shellEscape('Content-Type: application/json')}`)
    }

    const payload = options.maskSensitiveData
      ? getDisplayPayload(request.payload).value
      : request.payload

    parts.push(`--data ${shellEscape(JSON.stringify(payload))}`)
  }

  return parts.join(' \\\n  ')
}
