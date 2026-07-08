import {
  AddMarkerDialog,
  addMarkerDialogIsOpen,
} from '@src/components/AddMarkerDialog'
import ButtonElement from '@src/components/ButtonElement'
import {
  ExportHistoryDialog,
  exportDialogIsOpen,
} from '@src/components/ExportHistoryDialog'
import Icon from '@src/components/Icon'
import { Toast } from '@src/components/Toast'
import { closeDevTools } from '@src/initializeApp'
import { ApiExplorerPage } from '@src/pages/api-explorer/api-explorer'
import { CallerPage } from '@src/pages/caller/CallerPage'
import { LogsPage } from '@src/pages/logs/LogsPage'
import { StatsPage } from '@src/pages/stats/StatsPage'
import { TimelineViewPage } from '@src/pages/timeline/TimelineViewPage'
import { clearHistory } from '@src/stores/callsStore'
import { clearLogs } from '@src/stores/logsStore'
import {
  DevtoolsPage,
  setUiStore,
  showSensitiveValues,
  uiStore,
} from '@src/stores/uiStore'
import { globalStyle } from '@src/style/globalStyle'
import { centerContent } from '@src/style/helpers/centerContent'
import { fillContainer } from '@src/style/helpers/fillContainer'
import { stack } from '@src/style/helpers/stack'
import { resetStyle } from '@src/style/reset'
import { colors } from '@src/style/theme'
import {
  openDevtoolsInNewWindow,
  reattachDevtoolsWindow,
} from '@src/utils/openInNewWindow'
import { showToast } from '@src/utils/toast'
import { Icons } from '@src/config/icons'
import { cx } from '@utils/cx'
import { css } from 'solid-styled-components'

const containerStyle = css`
  ${resetStyle};
  ${globalStyle};

  position: fixed;
  inset: 32px;
  border-radius: 4px;
  background: ${colors.bgPrimary.var};
  display: grid;
  grid-template-columns: 51px 1fr;

  nav {
    ${stack()};
    border-right: 1px solid ${colors.white.alpha(0.1)};
    padding-bottom: 8px;

    button {
      ${centerContent};
      width: 100%;
      aspect-ratio: 1 / 1;
      color: ${colors.white.alpha(0.55)};
      --icon-size: 24px;
      position: relative;

      > * {
        position: relative;
      }

      &:hover {
        color: ${colors.white.var};
      }

      &.active {
        color: ${colors.bgPrimary.var};

        &::before {
          content: '';
          inset: 6px;
          border-radius: 3px;
          position: absolute;
          background: ${colors.primary.var};
        }
      }
    }

    .nav-actions {
      margin-top: auto;
      ${stack()};
      border-top: 1px solid ${colors.white.alpha(0.1)};

      button {
        aspect-ratio: 1 / 0.8;
        --icon-size: 19px;
        color: ${colors.white.alpha(0.45)};

        &:hover {
          color: ${colors.white.var};

          &.danger {
            color: ${colors.error.var};
          }
        }

        &.toggle-on,
        &.toggle-on:hover {
          color: ${colors.secondary.var};
        }
      }
    }
  }

  > main {
    overflow: hidden;

    > * {
      ${fillContainer};
    }
  }
`

const standaloneContainerStyle = css`
  &&& {
    inset: 0;
    border-radius: 0;
  }
`

const backdropStyle = css`
  ${fillContainer};
  position: fixed;
  inset: 0;
  backdrop-filter: blur(5px);
`

const pages: { id: DevtoolsPage; title: string; icon: Icons }[] = [
  { id: 'explorer', title: 'API Explorer', icon: 'network' },
  { id: 'timeline', title: 'Timeline', icon: 'clock' },
  { id: 'stats', title: 'API Stats', icon: 'chart-bar' },
  { id: 'logs', title: 'Logs', icon: 'file-text' },
  { id: 'caller', title: 'Request Caller', icon: 'send' },
]

export const App = (props: { standalone?: boolean }) => {
  return (
    <>
      {!props.standalone && (
        <div
          class={backdropStyle}
          onClick={closeDevTools}
        />
      )}
      <div
        class={cx(
          containerStyle,
          props.standalone && standaloneContainerStyle,
        )}
        id="dev-tools-root-element"
      >
        <nav>
          <For each={pages}>
            {(page) => (
              <ButtonElement
                title={page.title}
                classList={{ active: uiStore.selectedPage === page.id }}
                onClick={() => {
                  setUiStore('selectedPage', page.id)
                }}
              >
                <Icon name={page.icon} />
              </ButtonElement>
            )}
          </For>

          <div class="nav-actions">
            <ButtonElement
              classList={{ 'toggle-on': showSensitiveValues.value }}
              title={
                showSensitiveValues.value
                  ? 'Hide sensitive values'
                  : 'Show sensitive values'
              }
              onClick={() => {
                showSensitiveValues.value = !showSensitiveValues.value
              }}
            >
              <Icon name={showSensitiveValues.value ? 'eye-off' : 'eye'} />
            </ButtonElement>

            <ButtonElement
              title="Add a marker to the timeline"
              onClick={() => {
                addMarkerDialogIsOpen.value = true
              }}
            >
              <Icon name="flag" />
            </ButtonElement>

            <ButtonElement
              title="Export history"
              onClick={() => {
                exportDialogIsOpen.value = true
              }}
            >
              <Icon name="download" />
            </ButtonElement>

            {props.standalone ? (
              <ButtonElement
                title="Move devtools back to the app page"
                onClick={reattachDevtoolsWindow}
              >
                <Icon name="minimize-2" />
              </ButtonElement>
            ) : (
              <ButtonElement
                title="Open in a new window"
                onClick={openDevtoolsInNewWindow}
              >
                <Icon name="external-link" />
              </ButtonElement>
            )}

            <ButtonElement
              class="danger"
              title="Clear history"
              onClick={() => {
                clearHistory()
                clearLogs()
                showToast('History cleared')
              }}
            >
              <Icon name="trash" />
            </ButtonElement>
          </div>
        </nav>

        <main>
          <Switch>
            <Match when={uiStore.selectedPage === 'explorer'}>
              <ApiExplorerPage />
            </Match>
            <Match when={uiStore.selectedPage === 'timeline'}>
              <TimelineViewPage />
            </Match>
            <Match when={uiStore.selectedPage === 'stats'}>
              <StatsPage />
            </Match>
            <Match when={uiStore.selectedPage === 'logs'}>
              <LogsPage />
            </Match>
            <Match when={uiStore.selectedPage === 'caller'}>
              <CallerPage />
            </Match>
          </Switch>
        </main>

        <Show when={exportDialogIsOpen.value}>
          <ExportHistoryDialog />
        </Show>

        <Show when={addMarkerDialogIsOpen.value}>
          <AddMarkerDialog />
        </Show>

        <Toast />
      </div>
    </>
  )
}
