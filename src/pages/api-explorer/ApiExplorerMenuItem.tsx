import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { ApiCall, RequestSubTypes, RequestTypes } from '@src/stores/callsStore'
import { setUiStore, uiStore } from '@src/stores/uiStore'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { createSignalRef } from '@utils/solid'
import { css } from 'solid-styled-components'

const menuItemStyle = css`
  &&& {
    font-size: 14px;
    ${stack()};

    > .call {
      padding: 4px 12px;
      ${inline()};
      opacity: 0.8;

      &.selected {
        opacity: 1;
        background-color: ${colors.secondary.alpha(0.16)};
      }

      > button {
        text-align: left;
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
    }

    .subitem {
      text-align: left;
      padding: 4px 12px;
      padding-left: 14px;
      margin-left: 16px;
      border-left: 1px solid ${colors.white.alpha(0.1)};

      span {
        opacity: 0.6;
        padding: 4px 8px;
        margin-left: -8px;
        border-radius: 4px;
      }

      &.selected span {
        opacity: 1;
        background-color: ${colors.secondary.alpha(0.16)};
      }

      &:first-of-type {
        margin-top: 2px;
      }

      &:last-of-type {
        border-radius: 0 0 0 10px;
        border-bottom: 1px solid ${colors.white.alpha(0.1)};
        padding-bottom: 10px;
        margin-bottom: 4px;
      }
    }

    .expand-button {
      margin-left: auto;
      --icon-size: 16px;

      &.expanded {
        transform: rotate(180deg);
      }
    }
  }
`

type ApiExplorerMenuItemProps = {
  index: number
  currentCallId: string | null
  item: MenuItem
}

export type MenuItem = ApiCall & {
  id: string
  subitemsWithAlias: string[]
}

export const ApiExplorerMenuItem = (props: ApiExplorerMenuItemProps) => {
  const item = $(props.item)
  const currentCallId = $(props.currentCallId)

  const showSubitems = createSignalRef(props.item.subitemsWithAlias.length < 4)

  const typeIcon = getTypeIcon(item.type, item.subType)

  return (
    <div class={menuItemStyle}>
      <div
        class="call"
        classList={{
          selected: currentCallId
            ? currentCallId === item.id
            : props.index === 0,
        }}
      >
        <ButtonElement
          onClick={() => {
            setUiStore({ selectedCall: item.id, selectedSubitem: null })
          }}
        >
          <div
            class="tag"
            title={`${item.type}${item.subType ? ` (${item.subType})` : ''}`}
            style={{ color: typeIcon.color }}
          >
            {typeIcon.icon}
          </div>

          <span title={item.name}>{item.name}</span>
        </ButtonElement>

        {item.subitemsWithAlias.length > 0 && (
          <ButtonElement
            class="expand-button"
            classList={{
              expanded: showSubitems.value,
            }}
            onClick={() => {
              showSubitems.value = !showSubitems.value
            }}
          >
            <Icon name="caret-down" />
          </ButtonElement>
        )}
      </div>

      <Show when={showSubitems.value}>
        <For each={item.subitemsWithAlias}>
          {(subitem) => (
            <ButtonElement
              class="subitem"
              classList={{
                selected:
                  currentCallId === item.id &&
                  uiStore.selectedSubitem === subitem,
              }}
              onClick={() => {
                setUiStore({
                  selectedCall: item.id,
                  selectedSubitem: subitem,
                })
              }}
            >
              <span>{subitem}</span>
            </ButtonElement>
          )}
        </For>
      </Show>
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
