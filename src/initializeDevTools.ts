import { initializeApp } from '@src/initializeApp'
import { Config, setConfig } from '@src/stores/callsStore'

import tinykeys from 'tinykeys'

export function initializeDevTools({
  callsProcessor,
  shortcut = '$mod+D',
}: {
  callsProcessor: Config['callsProcessor']
  shortcut?: string
}) {
  tinykeys(window, {
    [shortcut]: (e) => {
      e.preventDefault()

      const active = document.activeElement
      const enteringText =
        active instanceof HTMLElement &&
        (active.isContentEditable ||
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA')

      if (enteringText) return

      initializeApp()
    },
  })

  setConfig({
    callsProcessor,
  })
}
