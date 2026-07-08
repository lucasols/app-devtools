import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { JsonViewer } from '@src/components/JsonViewer/JsonViewer'
import Select from '@src/components/Select'
import { TimelineMarker, callsStore } from '@src/stores/callsStore'
import {
  DevtoolsLog,
  LogSeverity,
  getLogExportEntry,
  logsStore,
} from '@src/stores/logsStore'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { copyToClipboard } from '@src/utils/copyToClipboard'
import { downloadJson } from '@src/utils/downloadJson'
import { showToast } from '@src/utils/toast'
import dayjs from 'dayjs'
import { createMemo } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    ${stack({ align: 'stretch' })};
    padding: 12px 16px;
    gap: 12px;
    overflow: hidden;

    > h1 {
      font-size: 16px;
      font-family: ${fonts.decorative};
      color: ${colors.secondary.var};
      flex-shrink: 0;
    }

    > .toolbar {
      ${inline({ gap: 8 })};
      flex-shrink: 0;

      .severity {
        font-size: 12px;
        font-family: ${fonts.decorative};
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid ${colors.white.alpha(0.15)};
        color: ${colors.white.alpha(0.7)};

        &.error {
          border-color: ${colors.error.alpha(0.5)};
          color: ${colors.error.var};
        }

        &.warning {
          border-color: ${colors.warning.alpha(0.5)};
          color: ${colors.warning.var};
        }

        &.info {
          border-color: ${colors.secondary.alpha(0.5)};
          color: ${colors.secondary.var};
        }

        &:hover {
          background: ${colors.white.alpha(0.05)};
        }

        &.active {
          background: ${colors.white.alpha(0.12)};
          border-color: currentColor;
        }
      }

      .category-select {
        width: 170px;
        flex-shrink: 0;
      }

      > .search {
        ${inline({ gap: 6 })};
        flex: 1 1;
        background: ${colors.white.alpha(0.05)};
        border-radius: 4px;
        padding: 5px 8px;
        --icon-size: 13px;

        .icon {
          color: ${colors.secondary.var};
          flex-shrink: 0;
        }

        input {
          border: none;
          background: transparent;
          color: ${colors.white.var};
          font-size: 12px;
          width: 100%;

          &:focus {
            outline: none;
          }
        }
      }

      > .action {
        ${inline({ gap: 5 })};
        font-size: 12px;
        color: ${colors.white.alpha(0.7)};
        padding: 5px 8px;
        border-radius: 4px;
        background: ${colors.white.alpha(0.05)};
        flex-shrink: 0;
        --icon-size: 13px;

        &:hover {
          color: ${colors.white.var};
          background: ${colors.white.alpha(0.1)};
        }
      }
    }

    > .list {
      ${stack({ align: 'stretch' })};
      flex: 1 1;
      gap: 2px;
      overflow-y: auto;
      padding-bottom: 16px;

      .empty {
        opacity: 0.4;
        font-size: 13px;
        padding-top: 8px;
      }

      .marker {
        ${inline({ gap: 8 })};
        padding: 3px 10px 3px 12px;
        color: ${colors.warning.var};
        --icon-size: 12px;

        .time {
          font-family: ${fonts.decorative};
          font-size: 12px;
          color: ${colors.warning.alpha(0.6)};
          flex-shrink: 0;
        }

        .icon {
          flex-shrink: 0;
        }

        .label {
          font-family: ${fonts.decorative};
          font-size: 11px;
          flex-shrink: 0;
        }

        .line {
          flex: 1 1;
          border-top: 1px dashed ${colors.warning.alpha(0.4)};
        }
      }

      .log {
        ${stack({ align: 'stretch' })};
        border-radius: 4px;

        &.expanded {
          background: ${colors.white.alpha(0.03)};
        }

        &.error > .row {
          border-left-color: ${colors.error.var};

          .badge {
            color: ${colors.error.var};
          }
        }

        &.warning > .row {
          border-left-color: ${colors.warning.var};

          .badge {
            color: ${colors.warning.var};
          }
        }

        &.info > .row {
          border-left-color: ${colors.secondary.alpha(0.7)};

          .badge {
            color: ${colors.secondary.var};
          }
        }

        > .row {
          ${inline({ gap: 10 })};
          padding: 5px 10px;
          border-left: 2px solid transparent;
          text-align: left;
          width: 100%;

          &:hover {
            background: ${colors.white.alpha(0.05)};

            .copy {
              opacity: 1;
            }
          }

          .time {
            font-family: ${fonts.decorative};
            font-size: 12px;
            color: ${colors.white.alpha(0.5)};
            flex-shrink: 0;
          }

          .badge {
            font-family: ${fonts.decorative};
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            width: 60px;
            flex-shrink: 0;
          }

          .category {
            font-size: 11px;
            color: ${colors.white.alpha(0.65)};
            padding: 1px 5px;
            border-radius: 4px;
            background: ${colors.white.alpha(0.08)};
            flex-shrink: 0;
          }

          .message {
            font-size: 13px;
            flex: 1 1;
            ${ellipsis};
          }

          .copy {
            ${inline()};
            flex-shrink: 0;
            padding: 2px;
            border-radius: 3px;
            color: ${colors.white.alpha(0.6)};
            opacity: 0;
            --icon-size: 13px;

            &:hover {
              color: ${colors.white.var};
              background: ${colors.white.alpha(0.1)};
            }
          }
        }

        &.expanded > .row .message {
          white-space: normal;
        }

        > .details {
          padding: 4px 12px 10px 32px;

          .no-details {
            font-size: 12px;
            opacity: 0.4;
          }
        }
      }
    }
  }
`

const severities: LogSeverity[] = ['error', 'warning', 'info']

const allCategoriesOption = '__all-categories__'

type LogListItem =
  | { itemType: 'log'; time: number; log: DevtoolsLog }
  | { itemType: 'marker'; time: number; marker: TimelineMarker }

export const LogsPage = () => {
  let severityFilter = $signal<LogSeverity | null>(null)
  let categoryFilter = $signal('')
  let searchQuery = $signal('')
  let expandedLogId = $signal<string | null>(null)

  const categories = createMemo(() => {
    const uniqueCategories = new Set<string>()

    for (const log of logsStore.logs) {
      if (log.category) {
        uniqueCategories.add(log.category)
      }
    }

    return [...uniqueCategories].sort()
  })

  const severityCounts = createMemo(() => {
    const counts: Record<LogSeverity, number> = {
      error: 0,
      warning: 0,
      info: 0,
    }

    for (const log of logsStore.logs) {
      counts[log.severity]++
    }

    return counts
  })

  const filteredLogs = createMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const severity = severityFilter
    const category = categoryFilter

    return logsStore.logs.filter(
      (log) =>
        (!severity || log.severity === severity) &&
        (!category || log.category === category) &&
        (!query ||
          log.message.toLowerCase().includes(query) ||
          (log.category ?
            log.category.toLowerCase().includes(query)
          : false)),
    )
  })

  const listItems = createMemo<LogListItem[]>(() => {
    const items: LogListItem[] = filteredLogs().map((log) => ({
      itemType: 'log',
      time: log.time,
      log,
    }))

    for (const marker of callsStore.markers) {
      items.push({ itemType: 'marker', time: marker.time, marker })
    }

    // newest first
    items.sort((a, b) => b.time - a.time)

    return items
  })

  function getVisibleLogsExport() {
    return {
      exportedAt: new Date().toISOString(),
      ...(callsStore.markers.length > 0
        ? {
            markers: callsStore.markers.map((marker) => ({
              label: marker.label,
              time: marker.time,
              timeISO: new Date(marker.time).toISOString(),
            })),
          }
        : {}),
      logs: filteredLogs().map((log) => getLogExportEntry(log)),
    }
  }

  return (
    <div class={containerStyle}>
      <h1>logs</h1>

      <div class="toolbar">
        <ButtonElement
          class="severity"
          classList={{ active: severityFilter === null }}
          onClick={() => {
            severityFilter = null
          }}
        >
          all ({logsStore.logs.length})
        </ButtonElement>

        <For each={severities}>
          {(severity) => (
            <ButtonElement
              class={`severity ${severity}`}
              classList={{ active: severityFilter === severity }}
              onClick={() => {
                severityFilter = severityFilter === severity ? null : severity
              }}
            >
              {severity} ({severityCounts()[severity]})
            </ButtonElement>
          )}
        </For>

        {categories().length > 0 && (
          <Select
            class="category-select"
            value={categoryFilter || allCategoriesOption}
            options={[
              { value: allCategoriesOption, label: 'all categories' },
              ...categories().map((category) => ({
                value: category,
                label: category,
              })),
            ]}
            onChange={(value) => {
              categoryFilter = value === allCategoriesOption ? '' : value
            }}
          />
        )}

        <label class="search">
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search logs"
            value={searchQuery}
            onInput={(e) => {
              searchQuery = e.currentTarget.value
            }}
          />
        </label>

        <ButtonElement
          class="action"
          title="Copy visible logs as JSON"
          onClick={() => {
            void copyToClipboard(
              JSON.stringify(getVisibleLogsExport(), null, 2),
            )
          }}
        >
          <Icon name="copy" />
          Copy JSON
        </ButtonElement>

        <ButtonElement
          class="action"
          title="Save visible logs to a .json file"
          onClick={() => {
            downloadJson(getVisibleLogsExport(), 'devtools-logs')
            showToast('Logs downloaded')
          }}
        >
          <Icon name="download" />
          Save .json
        </ButtonElement>
      </div>

      <div class="list">
        <For
          each={listItems()}
          fallback={
            <div class="empty">
              {logsStore.logs.length > 0
                ? 'no logs matching the filters'
                : 'no logs registered yet, use the addLog() export to collect logs here'}
            </div>
          }
        >
          {(item) =>
            item.itemType === 'marker' ? (
              <div class="marker">
                <span class="time">
                  {dayjs(item.marker.time).format('HH:mm:ss')}
                </span>
                <Icon name="flag" />
                <span class="label">{item.marker.label}</span>
                <div class="line" />
              </div>
            ) : (
              <LogRow
                log={item.log}
                expanded={expandedLogId === item.log.id}
                onToggleExpanded={() => {
                  expandedLogId = expandedLogId === item.log.id ? null : item.log.id
                }}
              />
            )
          }
        </For>
      </div>
    </div>
  )
}

const LogRow = (props: {
  log: DevtoolsLog
  expanded: boolean
  onToggleExpanded: () => void
}) => {
  return (
    <div
      class="log"
      classList={{
        [props.log.severity]: true,
        expanded: props.expanded,
      }}
    >
      <ButtonElement class="row" onClick={() => props.onToggleExpanded()}>
        <span
          class="time"
          title={dayjs(props.log.time).format('YYYY-MM-DD HH:mm:ss.SSS')}
        >
          {dayjs(props.log.time).format('HH:mm:ss')}
        </span>

        <span class="badge">{props.log.severity}</span>

        {props.log.category && (
          <span class="category">{props.log.category}</span>
        )}

        <span class="message">{props.log.message}</span>

        <span
          class="copy"
          title="Copy log as JSON"
          onClick={(e) => {
            e.stopPropagation()
            void copyToClipboard(getLogExportEntry(props.log))
          }}
        >
          <Icon name="copy" />
        </span>
      </ButtonElement>

      {props.expanded && (
        <div class="details">
          {props.log.details !== undefined ? (
            <JsonViewer value={props.log.details} />
          ) : (
            <div class="no-details">no details attached</div>
          )}
        </div>
      )}
    </div>
  )
}
