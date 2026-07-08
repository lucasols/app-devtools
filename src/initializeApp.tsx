import '@src/utils/initializeScreenLogger'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { render } from 'solid-js/web'
import Root from '@src/Root'
import { addGoogleFonts } from '@src/utils/addGoogleFonts'

let unmount: () => void = () => {}
let isOpen = false

/** opens the devtools panel, does nothing if it is already open */
export function openDevTools() {
  if (isOpen) return

  isOpen = true

  dayjs.extend(relativeTime)

  addGoogleFonts()

  if (navigator.platform.indexOf('Win') > -1) {
    document.body.classList.add('windows')
  }

  const devToolsRoot =
    document.getElementById('dev-tools-root') || document.createElement('div')

  devToolsRoot.id = 'dev-tools-root'

  document.body.appendChild(devToolsRoot)

  unmount = render(() => <Root />, devToolsRoot)
}

/** closes the devtools panel, does nothing if it is not open */
export function closeDevTools() {
  if (!isOpen) return

  isOpen = false
  unmount()
}

export function toggleDevTools() {
  if (isOpen) {
    closeDevTools()
  } else {
    openDevTools()
  }
}

export function devToolsIsOpen(): boolean {
  return isOpen
}
