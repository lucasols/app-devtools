import Icon from '@src/components/Icon'
import {
  ApiExplorerMenuItem,
  MenuItem,
} from '@src/pages/api-explorer/ApiExplorerMenuItem'
import { callsStore } from '@src/stores/callsStore'
import { uiStore } from '@src/stores/uiStore'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { transition } from '@src/style/helpers/transition'
import { colors, fonts } from '@src/style/theme'
import { searchItems } from '@utils/searchItems'
import { createReconciledArray, createSignalRef } from '@utils/solid'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    ${stack()};
    border-right: 1px solid ${colors.white.alpha(0.1)};

    > h1 {
      font-size: 18px;
      padding-left: 12px;
      padding-top: 10px;
      font-family: ${fonts.decorative};
      color: ${colors.secondary.var};
      padding-bottom: 12px;
    }
  }
`

const menuContainerStyle = css`
  &&& {
    ${stack()};
    flex: 1 1;
    overflow-y: auto;
    padding-bottom: 16px;
  }
`

const searchStyle = css`
  &&& {
    ${inline({ gap: 8 })};
    margin: 0 10px;
    margin-bottom: 12px;

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
  }
`

const tabsStyle = css`
  &&& {
    ${inline({ gap: 16 })};
    padding-left: 15px;
    margin-bottom: 10px;

    > button {
      font-size: 14px;
      opacity: 0.5;
      ${transition()};

      &:hover {
        opacity: 1;
      }

      &.active {
        opacity: 1;
        color: ${colors.primary.var};
      }
    }
  }
`

const selectedTab = createSignalRef<'api' | 'ws' | 'all'>('api')

export const ApiExplorerMenu = () => {
  const search = createSignalRef('')
  const listIsHovered = createSignalRef(false)

  // order of the last unfrozen sort, used to keep the list stable while the
  // mouse is over it so items don't move under the cursor
  let unfrozenOrder = new Map<string, number>()

  const menuItems = createReconciledArray(() => {
    const [callSearch = '', requestSearch = ''] = search.value.split('>')

    const callsEntries = Object.entries(callsStore.calls)

    const filtered: MenuItem[] = []

    for (const [key, value] of callsEntries) {
      const subitemsWithAlias = new Set<string>()

      if (selectedTab.value === 'api') {
        if (value.type !== 'fetch' && value.type !== 'mutation') {
          continue
        }
      }

      if (selectedTab.value === 'ws') {
        if (value.type !== 'ws') {
          continue
        }
      }

      for (const request of value.requests) {
        if (request.alias) {
          subitemsWithAlias.add(request.alias)
        }
      }

      filtered.push({
        id: key,
        subitemsWithAlias: searchItems({
          items: [...subitemsWithAlias],
          searchQuery: requestSearch.trim(),
          getStringToMatch(item) {
            return item
          },
        }),
        ...value,
      })
    }

    if (!listIsHovered.value) {
      // most recently active call first
      filtered.sort((a, b) => b.lastRequestStartTime - a.lastRequestStartTime)

      unfrozenOrder = new Map(filtered.map((item, index) => [item.id, index]))
    } else {
      filtered.sort((a, b) => {
        const aOrder = unfrozenOrder.get(a.id)
        const bOrder = unfrozenOrder.get(b.id)

        if (aOrder !== undefined && bOrder !== undefined) {
          return aOrder - bOrder
        }

        // calls added while the list is frozen go to the end
        if (aOrder === undefined && bOrder === undefined) {
          return b.lastRequestStartTime - a.lastRequestStartTime
        }

        return aOrder === undefined ? 1 : -1
      })
    }

    const searchedItems = searchItems({
      items: filtered,
      searchQuery: callSearch.trim(),
      getStringToMatch(item) {
        return item.name
      },
    })

    return searchedItems
  }, 'id')

  const currentCallId = $(uiStore.selectedCall)

  return (
    <div class={containerStyle}>
      <h1>API EXPLORER</h1>

      <div class={tabsStyle}>
        <button
          onClick={() => selectedTab.set('api')}
          classList={{ active: selectedTab.value === 'api' }}
        >
          API
        </button>
        <button
          onClick={() => selectedTab.set('ws')}
          classList={{ active: selectedTab.value === 'ws' }}
        >
          WebSocket
        </button>

        <button
          onClick={() => selectedTab.set('all')}
          classList={{ active: selectedTab.value === 'all' }}
        >
          All
        </button>
      </div>

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

      <div
        class={menuContainerStyle}
        onMouseEnter={() => {
          listIsHovered.value = true
        }}
        onMouseLeave={() => {
          listIsHovered.value = false
        }}
      >
        <For each={menuItems()}>
          {(item, i) => {
            return (
              <ApiExplorerMenuItem
                index={i()}
                item={item}
                currentCallId={currentCallId}
              />
            )
          }}
        </For>
      </div>
    </div>
  )
}
