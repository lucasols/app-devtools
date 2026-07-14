/**
 * device/browser context included in history exports, helps reproducing and
 * debugging issues that only happen in specific environments
 */
export function getEnvironmentInfo() {
  const nav: Navigator = navigator

  return {
    domain: window.location.hostname,
    // query and hash are omitted as they may contain sensitive data
    pageUrl: `${window.location.origin}${window.location.pathname}`,
    userAgent: nav.userAgent,
    platform: getPlatform(nav),
    language: nav.language,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utcOffsetMinutes: -new Date().getTimezoneOffset(),
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio,
    online: nav.onLine,
    cookiesEnabled: nav.cookieEnabled,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemoryGb: readNumber(
      'deviceMemory' in nav ? nav.deviceMemory : undefined,
    ),
    connection: getConnectionInfo(nav),
  }
}

/** modern chromium exposes the os via userAgentData, other browsers fall back
 * to the deprecated but still available navigator.platform */
function getPlatform(nav: Navigator): string | undefined {
  const userAgentData: unknown =
    'userAgentData' in nav ? nav.userAgentData : undefined

  if (typeof userAgentData === 'object' && userAgentData !== null) {
    const platform = readString(
      'platform' in userAgentData ? userAgentData.platform : undefined,
    )

    if (platform) return platform
  }

  return nav.platform || undefined
}

function getConnectionInfo(nav: Navigator):
  | {
      effectiveType: string | undefined
      downlinkMbps: number | undefined
      rttMs: number | undefined
      saveData: boolean | undefined
    }
  | undefined {
  const connection: unknown = 'connection' in nav ? nav.connection : undefined

  if (typeof connection !== 'object' || connection === null) return undefined

  return {
    effectiveType: readString(
      'effectiveType' in connection ? connection.effectiveType : undefined,
    ),
    downlinkMbps: readNumber(
      'downlink' in connection ? connection.downlink : undefined,
    ),
    rttMs: readNumber('rtt' in connection ? connection.rtt : undefined),
    saveData: readBoolean(
      'saveData' in connection ? connection.saveData : undefined,
    ),
  }
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}
