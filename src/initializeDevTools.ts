import { toggleDevTools } from '@src/initializeApp'
import { Config, setConfig } from '@src/stores/callsStore'
import {
  RequestCaller,
  setRequestCallers,
} from '@src/stores/requestCallerStore'

import { tinykeys } from 'tinykeys'

export function initializeDevTools({
  callsProcessor,
  shortcut,
  requestCallers,
  visibleRequestHeaders,
}: {
  callsProcessor?: Config['callsProcessor']
  /** use $mod for CMD or Ctrl */
  shortcut: string
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
}) {
  tinykeys(window, {
    [shortcut]: (e) => {
      const active = document.activeElement
      const enteringText =
        active instanceof HTMLElement &&
        (active.isContentEditable ||
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA')

      if (enteringText) return

      e.preventDefault()

      toggleDevTools()
    },
  })

  setConfig({
    ...(callsProcessor ? { callsProcessor } : {}),
    ...(visibleRequestHeaders ? { visibleRequestHeaders } : {}),
  })

  if (requestCallers) {
    setRequestCallers(requestCallers)
  }
}
