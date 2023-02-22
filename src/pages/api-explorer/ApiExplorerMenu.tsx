import Icon from '@src/components/Icon'
import {
  ApiCall,
  callsStore,
  RequestSubTypes,
  RequestTypes,
} from '@src/stores/callsStore'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { createReconciledArray, createSignalRef } from '@utils/solid'
import { Link, useLocation } from 'solid-app-router'
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
  padding-bottom: 16px;
`

const menuItemStyle = css`
  font-size: 14px;
  ${stack()};

  > a {
    padding: 4px 12px;
    ${inline({ gap: 8 })};
    opacity: 0.8;

    &.selected {
      opacity: 1;
      background-color: ${colors.secondary.alpha(0.16)};
    }

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

const searchStyle = css`
  ${inline({ gap: 8 })};
  margin: 0 10px;
  margin-bottom: 8px;

  display: grid;
  grid-template-columns: 14px 1fr;
  background: ${colors.white.alpha(0.05)};
  border-radius: 4px;
  --icon-size: 16px;
  padding: 4px 0;
  padding-left: 6px;

  .icon {
    color: ${colors.secondary.var};
  }

  input {
    border: none;
    background: transparent;
    color: ${colors.white.var};

    &:focus {
      outline: none;
    }
  }
`

export const ApiExplorerMenu = () => {
  const search = createSignalRef('')

  const menuItems = createReconciledArray(() => {
    const callsEntries = Object.entries(callsStore.calls)

    const filtered: (ApiCall & { id: string })[] = []

    for (const [key, value] of callsEntries.reverse()) {
      if (
        search.value.trim() &&
        !value.name.includes(search.value.toLowerCase())
      ) {
        continue
      }

      filtered.push({ id: key, ...value })
    }

    return filtered
  }, 'id')

  const currentCallId = $(useLocation().query.callId)

  return (
    <div class={containerStyle}>
      <h1>API EXPLORER</h1>

      <label class={searchStyle}>
        <Icon name="search" />
        <input
          type="text"
          placeholder="Search"
          value={search.value}
          onInput={(e) => {
            search.value = e.currentTarget.value
          }}
        />
      </label>

      <div class={menuContainerStyle}>
        <For each={menuItems()}>
          {(item, i) => {
            const typeIcon = getTypeIcon(item.type, item.subType)

            return (
              <div class={menuItemStyle}>
                <Link
                  href={`/api-explorer/?callId=${item.id}`}
                  classList={{
                    selected: currentCallId
                      ? currentCallId === item.id
                      : i() === 0,
                  }}
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
