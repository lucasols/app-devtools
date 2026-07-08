import { closeDevTools, openDevTools } from '@src/initializeApp'
import { App } from '@src/pages/app/App'
import { showToast } from '@src/utils/toast'
import { delegateEvents, render } from 'solid-js/web'

// events solid-js delegates on the main document, they need to be delegated
// on the popup document too so ui events work there
const delegatedEvents = [
  'beforeinput',
  'click',
  'dblclick',
  'contextmenu',
  'focusin',
  'focusout',
  'input',
  'keydown',
  'keyup',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'pointerdown',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'touchend',
  'touchmove',
  'touchstart',
]

let devtoolsWindow: Window | null = null

/** closes the detached devtools window and reopens the inline panel */
export function reattachDevtoolsWindow() {
  if (devtoolsWindow && !devtoolsWindow.closed) {
    devtoolsWindow.close()
  }

  devtoolsWindow = null

  openDevTools()
}

export function openDevtoolsInNewWindow() {
  if (devtoolsWindow && !devtoolsWindow.closed) {
    devtoolsWindow.focus()
    closeDevTools()
    return
  }

  const win = window.open(
    '',
    'app-devtools-window',
    'width=1400,height=900,popup=yes',
  )

  if (!win) {
    showToast('The popup was blocked by the browser')
    return
  }

  devtoolsWindow = win

  const doc = win.document

  doc.head.innerHTML = ''
  doc.body.innerHTML = ''
  doc.title = `App DevTools · ${window.location.host}`
  doc.body.style.margin = '0'
  doc.body.style.background = '#0F172A'

  // the theme color css variables are set as inline styles on the main
  // document root element, they need to be copied so colors resolve in the
  // popup document too
  const rootStyle = document.documentElement.style

  for (const property of rootStyle) {
    if (property.startsWith('--')) {
      doc.documentElement.style.setProperty(
        property,
        rootStyle.getPropertyValue(property),
      )
    }
  }

  if (document.body.classList.contains('windows')) {
    doc.body.classList.add('windows')
  }

  // mirror the styles from the main document (goober injects the app styles
  // in the main document head even for components rendered in the popup)
  const styleMirrors: {
    source: HTMLStyleElement
    mirror: HTMLStyleElement
  }[] = []

  document
    .querySelectorAll('style, link[rel="stylesheet"]')
    .forEach((node) => {
      const mirror = doc.importNode(node, true)

      doc.head.appendChild(mirror)

      if (node instanceof HTMLStyleElement && mirror instanceof HTMLStyleElement) {
        styleMirrors.push({ source: node, mirror })
      }
    })

  delegateEvents(delegatedEvents, doc)

  const root = doc.createElement('div')

  doc.body.appendChild(root)

  const dispose = render(() => <App standalone />, root)

  const syncStylesInterval = window.setInterval(() => {
    if (win.closed) {
      cleanup()
      return
    }

    for (const { source, mirror } of styleMirrors) {
      if (mirror.textContent !== source.textContent) {
        mirror.textContent = source.textContent
      }
    }
  }, 300)

  function cleanup() {
    window.clearInterval(syncStylesInterval)
    dispose()
    devtoolsWindow = null
  }

  win.addEventListener('pagehide', cleanup)

  // close the inline devtools panel, the popup replaces it
  closeDevTools()
}
