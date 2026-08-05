import { toggleDevTools } from '@src/initializeApp'
import {
  Config,
  addMarker,
  addNavigationChange,
  setConfig,
} from '@src/stores/callsStore'
import { setMaxLogsSizeMb } from '@src/stores/logsStore'
import {
  RequestCaller,
  setRequestCallers,
} from '@src/stores/requestCallerStore'

import { tinykeys } from 'tinykeys'

let stopTrackingNavigationChanges = () => undefined

function getCurrentNavigationPath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function initializeNavigationChangeTracking() {
  stopTrackingNavigationChanges()
  stopTrackingNavigationChanges = () => undefined

  let currentPath = getCurrentNavigationPath()

  function recordNavigationChange() {
    const nextPath = getCurrentNavigationPath()

    addNavigationChange(currentPath, nextPath)
    currentPath = nextPath
  }

  const originalPushState = window.history.pushState
  const originalReplaceState = window.history.replaceState

  const trackedPushState: History['pushState'] = function (data, unused, url) {
    originalPushState.call(window.history, data, unused, url)
    recordNavigationChange()
  }

  const trackedReplaceState: History['replaceState'] = function (
    data,
    unused,
    url,
  ) {
    originalReplaceState.call(window.history, data, unused, url)
    recordNavigationChange()
  }

  window.history.pushState = trackedPushState
  window.history.replaceState = trackedReplaceState
  window.addEventListener('popstate', recordNavigationChange)
  window.addEventListener('hashchange', recordNavigationChange)

  stopTrackingNavigationChanges = () => {
    if (window.history.pushState === trackedPushState) {
      window.history.pushState = originalPushState
    }

    if (window.history.replaceState === trackedReplaceState) {
      window.history.replaceState = originalReplaceState
    }

    window.removeEventListener('popstate', recordNavigationChange)
    window.removeEventListener('hashchange', recordNavigationChange)
  }
}

export function initializeDevTools({
  callsProcessor,
  shortcut,
  markerShortcut,
  requestCallers,
  visibleRequestHeaders,
  sensitiveDataFields,
  maxRequestsSizeMb,
  maxLogsSizeMb,
}: {
  callsProcessor?: Config['callsProcessor']
  /** use $mod for CMD or Ctrl */
  shortcut: string
  /** adds a timeline marker immediately, use $mod for CMD or Ctrl */
  markerShortcut?: string
  /**
   * callers used by the request caller tab to perform requests using the
   * consumer app data fetching mechanisms
   */
  requestCallers?: RequestCaller[]
  /**
   * request header values are masked in the ui by default (replaced by type
   * descriptions) as they may contain sensitive data, headers listed here
   * (case-insensitive) show their raw values
   */
  visibleRequestHeaders?: string[]
  /**
   * payload fields with these names (at any nesting level) have their values
   * masked in the ui (replaced by type descriptions), matching is
   * case-insensitive and ignores `_` and `-`, overrides the default list
   * (token, password, secret, apiKey, etc)
   */
  sensitiveDataFields?: string[]
  /**
   * approximate max stored size (in MB, based on json string length) for
   * requests across all call groups, oldest requests are evicted first to
   * avoid memory issues in long-running sessions (default: 30)
   */
  maxRequestsSizeMb?: number
  /**
   * approximate max stored size (in MB, based on json string length) for
   * logs, oldest logs are evicted first to avoid memory issues in
   * long-running sessions (default: 10)
   */
  maxLogsSizeMb?: number
}) {
  function userIsEnteringText() {
    const active = document.activeElement

    return (
      active instanceof HTMLElement &&
      (active.isContentEditable ||
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA')
    )
  }

  tinykeys(window, {
    [shortcut]: (e) => {
      if (userIsEnteringText()) return

      e.preventDefault()

      toggleDevTools()
    },
    ...(markerShortcut
      ? {
          [markerShortcut]: (e: KeyboardEvent) => {
            if (userIsEnteringText()) return

            e.preventDefault()
            addMarker()
          },
        }
      : {}),
  })

  setConfig({
    ...(callsProcessor ? { callsProcessor } : {}),
    ...(visibleRequestHeaders ? { visibleRequestHeaders } : {}),
    ...(sensitiveDataFields ? { sensitiveDataFields } : {}),
    ...(maxRequestsSizeMb !== undefined ? { maxRequestsSizeMb } : {}),
  })

  if (maxLogsSizeMb !== undefined) {
    setMaxLogsSizeMb(maxLogsSizeMb)
  }

  if (requestCallers) {
    setRequestCallers(requestCallers)
  }

  initializeNavigationChangeTracking()
}
