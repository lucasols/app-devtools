import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import {
  JsonSearchMode,
  formatPrimitiveValue,
  keyFilterSyntaxTooltip,
  resolveJsonSearchResult,
} from '@src/components/JsonViewer/jsonSearch'
import { allowTextSelection } from '@src/style/helpers/allowTextSelection'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { transition } from '@src/style/helpers/transition'
import { colors, fonts } from '@src/style/theme'
import { copyToClipboard } from '@src/utils/copyToClipboard'
import { formatNum } from '@src/utils/formatNum'
import { isObject } from '@utils/objectUtils'
import { JSXElement, createMemo, onCleanup } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    ${stack({ gap: 4 })};
  }
`

const toolbarStyle = css`
  &&& {
    ${inline({ gap: 6 })};
    position: sticky;
    top: 0;
    z-index: 2;
    background: ${colors.bgPrimary.var};
    /* set --json-toolbar-bleed to the container padding to make the toolbar
       stretch flush to the container edges */
    margin: calc(-1 * var(--json-toolbar-bleed, 0px));
    margin-bottom: 0;
    padding: var(--json-toolbar-bleed, 0px);
    padding-bottom: 4px;
    border-radius: 4px 4px 0 0;

    > label {
      ${inline({ gap: 6 })};
      flex: 1 1;
      background: ${colors.white.alpha(0.05)};
      border-radius: 4px;
      padding: 3px 8px;
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

    > .toolbar-button {
      ${inline()};
      padding: 4px;
      border-radius: 4px;
      color: ${colors.white.alpha(0.6)};
      --icon-size: 14px;
      font-size: 12px;
      white-space: nowrap;
      ${transition()};

      &:hover {
        background: ${colors.white.alpha(0.08)};
        color: ${colors.white.var};
      }

      &.active {
        color: ${colors.secondary.var};
        background: ${colors.secondary.alpha(0.16)};
      }
    }
  }
`

const searchMessageStyle = css`
  &&& {
    font-size: 12px;
    color: ${colors.warning.var};
    padding: 2px 0;
  }
`

const emptyResultStyle = css`
  &&& {
    font-size: 13px;
    opacity: 0.5;
    padding: 6px 0;
  }
`

const treeStyle = css`
  &&& {
    font-family: ${fonts.decorative};
    font-size: 13px;
    ${allowTextSelection};
    ${stack({ gap: 2 })};
    padding-left: 8px;

    .expand-button {
      margin-left: -16px;
      width: 16px;
      display: inline-block;
      vertical-align: middle;
      color: ${colors.white.alpha(0.5)};

      &:not(.expanded) .icon {
        transform: rotate(-90deg);
      }
    }

    .show-all {
      color: ${colors.white.alpha(0.5)};
      text-align: left;
    }

    .childs {
      ${stack({ gap: 2 })};
    }

    .delimiter {
      color: ${colors.white.alpha(0.5)};
      margin-top: 1px;
      margin-bottom: 1px;

      &.end {
        &::after {
          content: ',';
        }
      }
    }

    .childs {
      padding-left: 20px;
      grid-column: 1 / span 3;
      border-left: 1px solid ${colors.white.alpha(0.05)};

      > .value {
        &::after {
          content: ',';
          opacity: 0.5;
          color: ${colors.white.var};
        }
      }
    }

    .child {
      display: grid;
      grid-template-columns: auto auto 1fr;

      .key {
        color: #a5d6ff;
        margin-right: 5px;
        ${inline({ align: 'top' })};

        span {
          flex-shrink: 1;
          ${ellipsis};
        }

        &.index {
          color: ${colors.success.alpha(0.7)};
        }

        &::after {
          content: ':';
          color: ${colors.secondary.alpha(0.5)};
        }
      }
    }

    .string-quotes {
      opacity: 0.7;
    }

    .value {
      word-wrap: break-word;
      white-space: pre-wrap;

      &.clamped {
        display: -webkit-box;
        -webkit-line-clamp: 5;
        -webkit-box-orient: vertical;
        overflow: hidden;
        cursor: pointer;
      }
    }

    [data-type='number'] {
      color: ${colors.primary.var};
    }

    [data-type='boolean'] {
      color: ${colors.warning.var};
    }

    [data-type='object'],
    [data-type='undefined'] {
      color: ${colors.white.alpha(0.6)};
    }

    .collapsed {
      color: ${colors.white.alpha(0.5)};
      cursor: pointer;

      > span {
        color: ${colors.white.alpha(0.4)};
      }
    }

    .copy-value {
      display: none;
      vertical-align: middle;
      margin-left: 6px;
      padding: 1px 2px;
      border-radius: 3px;
      color: ${colors.white.alpha(0.55)};
      --icon-size: 12px;

      &:hover {
        color: ${colors.white.var};
        background: ${colors.white.alpha(0.08)};
      }
    }

    .value:hover > .copy-value,
    .delimiter:hover > .copy-value,
    .collapsed:hover > .copy-value {
      display: inline-flex;
    }
  }
`

const compactMaxChildren = 14
const clampStringsLongerThan = 600

export type JsonViewerExpandDepth = 'all' | 'none' | number

type JsonTreeContext = {
  compact: boolean
  getInitialExpanded: (indent: number) => boolean
}

type JsonViewerProps = {
  value: unknown
  compact?: boolean
  /** shows the search/filter toolbar */
  search?: boolean
  /** extra buttons rendered at the end of the search toolbar */
  toolbarActions?: JSXElement
}

const CopyValueButton = (props: { value: unknown }) => (
  <ButtonElement
    class="copy-value"
    title="Copy value"
    onClick={(e) => {
      e.stopPropagation()
      void copyToClipboard(props.value)
    }}
  >
    <Icon name="copy" />
  </ButtonElement>
)

const ValueItem = (props: {
  value: unknown
  indent: number
  key?: string
  index?: number
  ctx: JsonTreeContext
}) => {
  let expanded = $signal(props.ctx.getInitialExpanded(props.indent))
  let showAllChilds = $signal(!props.ctx.compact)

  const maxCompactChildrenToUse = props.indent >= 2 ? 5 : compactMaxChildren

  return (
    <>
      {(() => {
        const value = props.value
        const valueIsArray = Array.isArray(value)
        const valueIsObject = !valueIsArray && isObject(value)

        const hasKey = props.key !== undefined || props.index !== undefined

        const showExpandButton =
          (valueIsArray && value.length > 0) ||
          (valueIsObject && Object.keys(value).length > 0)

        const toggleExpanded = showExpandButton && (
          <ButtonElement
            onClick={() => {
              expanded = !expanded
            }}
            classList={{
              expanded,
            }}
            class="expand-button"
          >
            <Icon
              name="caret-down"
              size={14}
            />
          </ButtonElement>
        )

        return (
          <>
            {hasKey && (
              <div
                class="key"
                title={`${
                  props.key ? `${props.key}\n` : ''
                }Shift + Click to copy value`}
                classList={{
                  index: props.index !== undefined,
                }}
                onClick={(e) => {
                  if (e.shiftKey) {
                    void copyToClipboard(value)
                  }
                }}
              >
                {valueIsArray || valueIsObject ? toggleExpanded : null}
                <span>{props.key || props.index}</span>
              </div>
            )}

            {hasKey && showExpandButton && !expanded ? (
              <div
                class="collapsed"
                onClick={() => {
                  expanded = true
                }}
              >
                {valueIsArray ? (
                  `[…] ${value.length} items`
                ) : (
                  <>
                    {`{…} ${Object.keys(value).length} props`}
                    {getObjId(value)}
                  </>
                )}
                <CopyValueButton value={value} />
              </div>
            ) : (
              ((): JSXElement => {
                if (valueIsArray && value.length === 0) {
                  return <div class="delimiter">[]</div>
                }

                if (valueIsObject && Object.keys(value).length === 0) {
                  return <div class="delimiter">{`{}`}</div>
                }

                if (valueIsArray || valueIsObject) {
                  const entries = valueIsArray
                    ? value.map((item): [string | null, unknown] => [
                        null,
                        item,
                      ])
                    : Object.entries(value)

                  const delimiters = valueIsArray
                    ? (['[', ']'] as const)
                    : (['{', '}'] as const)

                  const collapsedLabel = valueIsArray
                    ? `[…] ${entries.length} items`
                    : `{…} ${entries.length} properties`

                  return (
                    <>
                      <div
                        class="delimiter"
                        title={
                          !hasKey ? 'Shift + Click to copy value' : undefined
                        }
                        onClick={
                          !hasKey
                            ? (e) => {
                                if (e.shiftKey) {
                                  void copyToClipboard(value)
                                } else if (!expanded) {
                                  expanded = true
                                }
                              }
                            : undefined
                        }
                      >
                        {!hasKey && toggleExpanded}

                        {expanded ? delimiters[0] : collapsedLabel}
                        <CopyValueButton value={value} />
                      </div>

                      {expanded && (
                        <>
                          <div class="childs">
                            {(() => {
                              let items = entries
                              const totalSize = items.length

                              if (!showAllChilds) {
                                items = items.slice(0, maxCompactChildrenToUse)
                              }

                              return (
                                <>
                                  {items.map(([key, itemValue], index) => (
                                    <div class="child">
                                      <ValueItem
                                        value={itemValue}
                                        indent={props.indent + 1}
                                        key={key ?? undefined}
                                        index={
                                          key === null ? index : undefined
                                        }
                                        ctx={props.ctx}
                                      />
                                    </div>
                                  ))}

                                  {!showAllChilds &&
                                    totalSize > maxCompactChildrenToUse && (
                                      <ButtonElement
                                        onClick={() => {
                                          showAllChilds = true
                                        }}
                                        class="show-all"
                                      >
                                        …show all (+
                                        {totalSize - maxCompactChildrenToUse})
                                      </ButtonElement>
                                    )}
                                </>
                              )
                            })()}
                          </div>
                          <div class="delimiter end">{delimiters[1]}</div>
                        </>
                      )}
                    </>
                  )
                }

                return <PrimitiveValue value={value} />
              })()
            )}
          </>
        )
      })()}
    </>
  )
}

const PrimitiveValue = (props: { value: unknown }) => {
  const isLongString =
    typeof props.value === 'string' &&
    props.value.length > clampStringsLongerThan

  let clamped = $signal(isLongString)

  return (
    <div
      class="value"
      classList={{ clamped }}
      data-type={typeof props.value}
      title={
        clamped
          ? 'Click to show full value\nShift + Click to copy value'
          : 'Shift + Click to copy value'
      }
      onClick={(e) => {
        if (e.shiftKey) {
          void copyToClipboard(
            typeof props.value === 'string'
              ? props.value
              : String(props.value),
          )
        } else if (clamped) {
          clamped = false
        }
      }}
    >
      {typeof props.value === 'string' && <span class="string-quotes">"</span>}
      {typeof props.value === 'number'
        ? formatNum(props.value)
        : typeof props.value === 'string'
        ? props.value
        : formatPrimitiveValue(props.value)}
      {typeof props.value === 'string' && <span class="string-quotes">"</span>}
      <CopyValueButton value={props.value} />
    </div>
  )
}

export const JsonViewer = (props: JsonViewerProps) => {
  let searchQuery = $signal('')
  let debouncedQuery = $signal('')
  let searchMode = $signal<JsonSearchMode>('text')
  let showOriginalIndexes = $signal(false)
  let expandDepth = $signal<JsonViewerExpandDepth>('all')
  let treeRevision = $signal(1)

  let debounceTimeout: number | undefined

  onCleanup(() => clearTimeout(debounceTimeout))

  function setSearchQuery(query: string) {
    searchQuery = query

    clearTimeout(debounceTimeout)
    debounceTimeout = window.setTimeout(() => {
      debouncedQuery = query
    }, 150)
  }

  function setExpandDepth(depth: JsonViewerExpandDepth) {
    expandDepth = depth
    treeRevision = treeRevision + 1
  }

  const searchResult = createMemo(() =>
    resolveJsonSearchResult(
      props.value,
      props.search ? debouncedQuery : '',
      searchMode,
      showOriginalIndexes,
    ),
  )

  const ctx = createMemo((): JsonTreeContext => {
    const isSearching = debouncedQuery.trim() !== ''
    const depth = expandDepth
    const compact = !!props.compact

    return {
      compact,
      getInitialExpanded(indent) {
        if (depth === 'none') return false
        if (typeof depth === 'number') return indent < depth
        if (isSearching) return true
        if (compact && indent >= 3) return false
        return true
      },
    }
  })

  return (
    <div class={containerStyle}>
      {props.search && (
        <div class={toolbarStyle}>
          <label>
            <Icon name="search" />
            <input
              type="text"
              placeholder={
                searchMode === 'keys'
                  ? 'Filter keys with patterns'
                  : 'Search keys and values'
              }
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </label>

          <ButtonElement
            class="toolbar-button"
            classList={{ active: searchMode === 'keys' }}
            title={keyFilterSyntaxTooltip}
            onClick={() => {
              searchMode = searchMode === 'keys' ? 'text' : 'keys'
            }}
          >
            <Icon name="key" />
          </ButtonElement>

          <ButtonElement
            class="toolbar-button"
            classList={{ active: showOriginalIndexes }}
            title="Show original array indexes in filtered results"
            onClick={() => {
              showOriginalIndexes = !showOriginalIndexes
            }}
          >
            #
          </ButtonElement>

          <ButtonElement
            class="toolbar-button"
            classList={{ active: expandDepth === 'none' }}
            title="Collapse all"
            onClick={() => setExpandDepth('none')}
          >
            <Icon name="chevrons-down-up" />
          </ButtonElement>

          <ButtonElement
            class="toolbar-button"
            classList={{ active: expandDepth === 'all' }}
            title="Expand all"
            onClick={() => setExpandDepth('all')}
          >
            <Icon name="chevrons-up-down" />
          </ButtonElement>

          <ButtonElement
            class="toolbar-button"
            classList={{ active: typeof expandDepth === 'number' }}
            title="Expand up to a level"
            onClick={() => {
              const answer = window.prompt(
                'Expand up to level (1-20)',
                String(typeof expandDepth === 'number' ? expandDepth : 2),
              )

              if (!answer) return

              const level = Number.parseInt(answer, 10)

              if (Number.isNaN(level)) return

              setExpandDepth(Math.max(1, Math.min(level, 20)))
            }}
          >
            {typeof expandDepth === 'number' ? `lvl ${expandDepth}` : 'lvl'}
          </ButtonElement>

          <ButtonElement
            class="toolbar-button"
            title="Copy visible value as JSON"
            onClick={() => {
              void copyToClipboard(searchResult().value)
            }}
          >
            <Icon name="copy" />
          </ButtonElement>

          {props.toolbarActions}
        </div>
      )}

      {searchResult().message && (
        <div class={searchMessageStyle}>{searchResult().message}</div>
      )}

      {searchResult().isEmpty ? (
        <div class={emptyResultStyle}>No matches</div>
      ) : (
        <Show
          when={{
            revision: treeRevision,
            result: searchResult(),
            treeCtx: ctx(),
          }}
          keyed
        >
          {({ result, treeCtx }) => (
            <div class={treeStyle}>
              <ValueItem
                value={result.value}
                indent={0}
                ctx={treeCtx}
              />
            </div>
          )}
        </Show>
      )}
    </div>
  )
}

function getObjId(obj: Record<string, unknown>): JSXElement | null {
  if ('id' in obj) {
    return <span> · id: {String(obj.id)}</span>
  }

  const keys = Object.keys(obj)

  for (const key of keys) {
    if (key.startsWith('id_')) {
      const id = obj[key]

      if (typeof id === 'string' || typeof id === 'number') {
        return <span> · id: {id}</span>
      }
    }
  }

  if ('key' in obj) {
    return <span> · id: {String(obj.key)}</span>
  }

  return ''
}
