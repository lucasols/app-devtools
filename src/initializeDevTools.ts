import { initializeApp } from '@src/initializeApp'
import { Config, setConfig } from '@src/stores/callsStore'

import tinykeys from 'tinykeys'
import html from '../index.html?raw'

export function initializeDevTools({
  callsProcessor,
  shortcut = '$mod+D',
}: {
  callsProcessor: Config['callsProcessor']
  shortcut?: string
}) {
  tinykeys(window, {
    [shortcut]: () => {
      const active = document.activeElement
      const enteringText =
        active instanceof HTMLElement &&
        (active.isContentEditable ||
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA')

      if (enteringText) return

      openDevToolsWindow()
    },
  })

  setConfig({
    callsProcessor,
  })
}

function openDevToolsWindow() {
  const devToolsWindow = window.open(
    undefined,
    'App Devtools',
    'width=800,height=600',
  )

  devToolsWindow?.document.write(html)

  if (devToolsWindow) {
    initializeApp(devToolsWindow.document)
    devToolsWindow.focus()
  }
}
