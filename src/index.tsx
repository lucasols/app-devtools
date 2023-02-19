import Root from '@src/Root'
import '@src/style/reset.css'
import { initializeScreenLogger } from '@utils/screenLogger'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { render } from 'solid-js/web'
import { registerSW } from 'virtual:pwa-register'

dayjs.extend(relativeTime)

if (import.meta.env.DEV) {
  initializeScreenLogger()
}

const updateSW = registerSW({
  onNeedRefresh() {
    // eslint-disable-next-line no-alert
    const reload = window.confirm('New version available, refresh?')

    if (reload) {
      void updateSW()
    }
  },
})

render(() => <Root />, document.getElementById('app')!)
