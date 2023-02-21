import {
  RequestSubTypes,
  RequestTypes,
  callsStore,
} from '@src/stores/callsStore'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { Link } from 'solid-app-router'
import { createMemo } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  ${stack()};
  border-right: 1px solid ${colors.white.alpha(0.1)};

  > h1 {
    font-size: 18px;
    padding-left: 12px;
    padding-top: 10px;
    font-family: ${fonts.decorative};
    color: ${colors.secondary.var};
    padding-bottom: 16px;
  }
`

const menuContainerStyle = css`
  ${stack()};
  flex: 1 1;
  overflow-y: auto;
`

const menuItemStyle = css`
  font-size: 14px;
  ${stack()};

  > a {
    padding: 4px 12px;
    ${inline({ gap: 8 })};

    > .tag {
      font-weight: 600;
      font-family: ${fonts.decorative};
    }

    > span {
      ${ellipsis};
      flex-shrink: 1;
    }
  }
`

export const ApiExplorerMenu = () => {
  const menuItems = createMemo(() => {
    const callsEntries = Object.entries(callsStore.calls).reverse()

    return callsEntries.map(([key, value]) => {
      return { id: key, ...value }
    })
  })

  return (
    <div class={containerStyle}>
      <h1>API EXPLORER</h1>

      {/* FIX: search */}

      <div class={menuContainerStyle}>
        <For each={menuItems()}>
          {(item) => {
            const typeIcon = getTypeIcon(item.type, item.subType)

            return (
              <div class={menuItemStyle}>
                <Link
                  href={`/api-explorer/?call=${encodeURIComponent(item.id)}`}
                >
                  <div
                    class="tag"
                    title={`${item.type}${
                      item.subType ? ` (${item.subType})` : ''
                    }`}
                    style={{ color: typeIcon.color }}
                  >
                    {typeIcon.icon}
                  </div>

                  <span title={item.name}>{item.name}</span>
                </Link>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

function getTypeIcon(
  type: RequestTypes,
  subType: RequestSubTypes | undefined,
): {
  icon: string
  color: string
} {
  let icon = ''
  let color = ''

  if (type === 'fetch') {
    icon = 'F'
    color = '#FDE047'
  } else {
    if (subType) {
      if (subType === 'create') {
        icon = 'C'
        color = '#6EE7B7'
      } else if (subType === 'update') {
        icon = 'U'
        color = '#A78BFA'
      } else if (subType === 'delete') {
        icon = 'D'
        color = '#E53558'
      } else {
        icon = subType[0]?.toUpperCase() || '?'
        color = '#FDE047'
      }
    } else {
      icon = 'M'
      color = '#A78BFA'
    }
  }

  return {
    icon,
    color,
  }
}
