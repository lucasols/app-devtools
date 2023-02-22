import '@src/utils/initializeScreenLogger'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { render } from 'solid-js/web'
import { colors, fonts } from '@src/style/theme'
import '@src/style/reset.css'
import '@src/style/globalStyle.css'
import Root from '@src/Root'

export function initializeApp() {
  dayjs.extend(relativeTime)

  if (navigator.platform.indexOf('Win') > -1) {
    document.body.classList.add('windows')
  }

  document.body.style.setProperty('--primary-font', fonts.primary)
  document.body.style.setProperty(
    '--text-primary-color',
    colors.textPrimary.var,
  )

  render(() => <Root />, document.getElementById('app')!)
}
