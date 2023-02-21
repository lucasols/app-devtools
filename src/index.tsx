import '@src/utils/initializeScreenLogger'
import Root from '@src/Root'
import '@src/style/reset.css'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { render } from 'solid-js/web'

dayjs.extend(relativeTime)

render(() => <Root />, document.getElementById('app')!)
