import { initializeApp } from '@src/initializeApp'
import { initializeDevTools } from '@src/initializeDevTools'
import { addCall } from '@src/stores/callsStore'

export { initializeDevTools, addCall }

if (import.meta.env.DEV) {
  initializeApp()

  initializeDevTools({
    callsProcessor: [
      {
        match: '/objectProperties/index',
        callName: 'table fields',
        payloadAlias(payload: { object_type: string }) {
          return `table: ${payload.object_type}`
        },
      },
      {
        match: '/v3/tab/:id/views',
        // callName: 'tab views',
        payloadAlias(_, request) {
          return `tab: ${request.pathParams?.id}`
        },
      },
      {
        match: '/v3/tabs/:id',
        callName: 'tab config',
        payloadAlias(_, request) {
          return `tab: ${request.pathParams?.id}`
        },
      },
      {
        match: '/v3/low-code-functions/list-triggers/:id',
        callName: 'low code triggers',
        payloadAlias(_, request) {
          return `tab: ${request.pathParams?.id}`
        },
      },
    ],
  })
}