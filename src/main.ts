/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  closeDevTools,
  devToolsIsOpen,
  openDevTools,
  toggleDevTools,
} from '@src/initializeApp'
import { initializeDevTools } from '@src/initializeDevTools'
import {
  addCall,
  type RegisterCallResult,
  type RequestWarning,
  type RequestWarningInput,
  addWebsocketEvent,
  addMarker,
  clearHistory,
} from '@src/stores/callsStore'
import {
  addLog,
  clearLogs,
  type DevtoolsLog,
  type LogSeverity,
} from '@src/stores/logsStore'
import { type RequestCaller } from '@src/stores/requestCallerStore'

export {
  initializeDevTools,
  openDevTools,
  closeDevTools,
  toggleDevTools,
  devToolsIsOpen,
  addCall,
  RegisterCallResult,
  RequestWarning,
  RequestWarningInput,
  addWebsocketEvent,
  addMarker,
  clearHistory,
  addLog,
  clearLogs,
  DevtoolsLog,
  LogSeverity,
  RequestCaller,
}

if (import.meta.env.DEV) {
  openDevTools()

  initializeDevTools({
    shortcut: 'D',
    visibleRequestHeaders: ['x-trace-id', 'x-app-version'],
    requestCallers: [
      {
        name: 'mock api',
        call: async ({ path, method, payload }) => {
          await new Promise((resolve) => setTimeout(resolve, 600))

          if (path.includes('error')) {
            return {
              response: { error: 'mocked error response' },
              status: 500,
              isError: true,
            }
          }

          return {
            response: {
              ok: true,
              echo: { path, method, payload },
              items: [
                { id: 1, name: 'item 1' },
                { id: 2, name: 'item 2' },
              ],
            },
            status: 200,
          }
        },
      },
      {
        name: 'mock api 2',
        methods: ['GET', 'POST'],
        call: async ({ path }) => {
          await new Promise((resolve) => setTimeout(resolve, 300))

          return { response: { ok: true, caller: 2, path }, status: 200 }
        },
      },
    ],
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
        callName: 'tab view',
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
        match: '/object/list',
        payloadAlias(payload) {
          return `table: ${payload.object_type}`
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
