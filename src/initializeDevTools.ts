import { toggleDevTools } from '@src/initializeApp'
import { Config, addMarker, setConfig } from '@src/stores/callsStore'
import { setMaxLogsSizeMb } from '@src/stores/logsStore'
import {
  RequestCaller,
  setRequestCallers,
} from '@src/stores/requestCallerStore'

import { tinykeys } from 'tinykeys'

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
}
