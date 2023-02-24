import { initializeApp } from '@src/initializeApp'
import { Config, setConfig } from '@src/stores/callsStore'

import tinykeys from 'tinykeys'

export function initializeDevTools({
  callsProcessor,
  shortcut,
}: {
  callsProcessor?: Config['callsProcessor']
  /** use $mod for CMD or Ctrl */
  shortcut: string
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

      initializeApp()
    },
  })

  setConfig({
    callsProcessor,
  })
}
