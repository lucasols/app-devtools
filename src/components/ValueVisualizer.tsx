import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { allowTextSelection } from '@src/style/helpers/allowTextSelection'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { multilineEllipsis } from '@src/style/helpers/multilineEllipsis'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { formatNum } from '@src/utils/formatNum'
import { isObject } from '@utils/objectUtils'
import { JSXElement } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
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
      ${multilineEllipsis(5)};
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

      > span {
        color: ${colors.white.alpha(0.4)};
      }
    }
  }
`

const compactMaxChilds = 14

type ValueVisualizerProps = {
  value: unknown
  compact?: boolean
}

const ValueItem = (props: {
  value: unknown
  indent: number
  key?: string
  index?: number
  compact: boolean
}) => {
  let expanded = $signal(props.indent > 0 && props.compact ? false : true)
  let showAllChilds = $signal(!props.compact)

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
                    copyToClipboard(value)
                  }
                }}
              >
                {valueIsArray || valueIsObject ? toggleExpanded : null}
                <span>{props.key || props.index}</span>
              </div>
            )}

            {hasKey && showExpandButton && !expanded ? (
              <div class="collapsed">
                {valueIsArray ? (
                  `[…] ${value.length} items`
                ) : (
                  <>
                    {`{…} ${Object.keys(value).length} props`}
                    {getObjId(value)}
                  </>
                )}
              </div>
            ) : (
              ((): JSXElement => {
                if (valueIsArray && value.length === 0) {
                  return <div class="delimiter">[]</div>
                }

                if (valueIsObject && Object.keys(value).length === 0) {
                  return <div class="delimiter">{`{}`}</div>
                }

                if (valueIsArray) {
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
                                  copyToClipboard(value)
                                }
                              }
                            : undefined
                        }
                      >
                        {!hasKey && toggleExpanded}

                        {expanded ? '[' : `[…] ${value.length} items`}
                      </div>

                      {expanded && (
                        <>
                          <div class="childs">
                            {(() => {
                              let items = value
                              const totalSize = items.length

                              if (!showAllChilds) {
                                items = items.slice(0, compactMaxChilds)
                              }

                              return (
                                <>
                                  {items.map((item, index) => (
                                    <div class="child">
                                      <ValueItem
                                        value={item}
                                        indent={props.indent + 1}
                                        index={index}
                                        compact={props.compact}
                                      />
                                    </div>
                                  ))}

                                  {!showAllChilds &&
                                    totalSize > compactMaxChilds && (
                                      <ButtonElement
                                        onClick={() => {
                                          showAllChilds = true
                                        }}
                                        class="show-all"
                                      >
                                        …show all (+
                                        {totalSize - compactMaxChilds})
                                      </ButtonElement>
                                    )}
                                </>
                              )
                            })()}
                          </div>
                          <div class="delimiter end">]</div>
                        </>
                      )}
                    </>
                  )
                }

                if (valueIsObject) {
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
                                  copyToClipboard(value)
                                }
                              }
                            : undefined
                        }
                      >
                        {!hasKey && toggleExpanded}

                        {expanded
                          ? '{'
                          : `{…} ${Object.keys(value).length} properties`}
                      </div>

                      {expanded && (
                        <>
                          <div class="childs">
                            {(() => {
                              let entries = Object.entries(value)
                              const totalSize = entries.length

                              if (!showAllChilds) {
                                entries = entries.slice(0, compactMaxChilds)
                              }

                              return (
                                <>
                                  {entries.map(([key, objValue]) => (
                                    <div class="child">
                                      <ValueItem
                                        value={objValue}
                                        key={key}
                                        indent={props.indent + 1}
                                        compact={props.compact}
                                      />
                                    </div>
                                  ))}

                                  {!showAllChilds &&
                                    totalSize > compactMaxChilds && (
                                      <ButtonElement
                                        onClick={() => {
                                          showAllChilds = true
                                        }}
                                        class="show-all"
                                      >
                                        …show all (+
                                        {totalSize - compactMaxChilds})
                                      </ButtonElement>
                                    )}
                                </>
                              )
                            })()}
                          </div>
                          <div class="delimiter end">{'}'}</div>
                        </>
                      )}
                    </>
                  )
                }

                return (
                  <div
                    class="value"
                    data-type={typeof value}
                    title="Shift + Click to copy value"
                    onClick={(e) => {
                      if (e.shiftKey) {
                        copyToClipboard(String(value))
                      }
                    }}
                  >
                    {typeof value === 'string' && (
                      <span class="string-quotes">"</span>
                    )}
                    {typeof value === 'number'
                      ? formatNum(value)
                      : String(value)}
                    {typeof value === 'string' && (
                      <span class="string-quotes">"</span>
                    )}
                  </div>
                )
              })()
            )}
          </>
        )
      })()}
    </>
  )
}

export const ValueVisualizer = (props: ValueVisualizerProps) => {
  return (
    <div class={containerStyle}>
      <ValueItem
        value={props.value}
        indent={0}
        compact={!!props.compact}
      />
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

  return ''
}

async function copyToClipboard(text: unknown) {
  await navigator.clipboard.writeText(
    typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text),
  )

  alert('Copied to clipboard')
}
