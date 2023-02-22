import Icon from '@src/components/Icon'
import {
  ApiExplorerMenuItem,
  MenuItem,
} from '@src/pages/api-explorer/ApiExplorerMenuItem'
import { callsStore } from '@src/stores/callsStore'
import { uiStore } from '@src/stores/uiStore'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
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
      padding-bottom: 16px;
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
  }
`

export const ApiExplorerMenu = () => {
  const search = createSignalRef('')

  const menuItems = createReconciledArray(() => {
    const callsEntries = Object.entries(callsStore.calls)

    const filtered: MenuItem[] = []

    for (const [key, value] of callsEntries.reverse()) {
      if (
        search.value.trim() &&
        !value.name.includes(search.value.toLowerCase())
      ) {
        continue
      }

      const subitemsWithAlias = new Set<string>()

      for (const request of value.requests) {
        if (request.alias) {
          subitemsWithAlias.add(request.alias)
        }
      }

      filtered.push({
        id: key,
        subitemsWithAlias: [...subitemsWithAlias],
        ...value,
      })
    }

    return filtered
  }, 'id')

  const currentCallId = $(uiStore.selectedCall)

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
