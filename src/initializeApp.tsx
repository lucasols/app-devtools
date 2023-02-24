import '@src/utils/initializeScreenLogger'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { render } from 'solid-js/web'
import Root from '@src/Root'
import { addGoogleFonts } from '@src/utils/addGoogleFonts'

let unmount: () => void = () => {}
let isInitialized = false

export function initializeApp() {
  dayjs.extend(relativeTime)

  if (isInitialized) {
    unmountApp()
    isInitialized = false
    return
  }

  isInitialized = true

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

export function unmountApp() {
  unmount()
}
