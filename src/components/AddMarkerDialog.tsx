import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { addMarker } from '@src/stores/callsStore'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts, shadows } from '@src/style/theme'
import { showToast } from '@src/utils/toast'
import { createSignalRef } from '@utils/solid'
import dayjs from 'dayjs'
import { css } from 'solid-styled-components'

export const addMarkerDialogState = createSignalRef<{
  /** marker time, defaults to now */
  time?: number
} | null>(null)

export function openAddMarkerDialog(atTime?: number) {
  addMarkerDialogState.value = { time: atTime }
}

const overlayStyle = css`
  &&& {
    position: absolute;
    inset: 0;
    z-index: 50;
    background: ${colors.black.alpha(0.5)};
    ${inline({ justify: 'center' })};
  }
`

const dialogStyle = css`
  &&& {
    ${stack({ align: 'stretch' })};
    width: 360px;
    max-width: calc(100% - 48px);
    background: ${colors.bgSecondary.var};
    border: 1px solid ${colors.white.alpha(0.1)};
    border-radius: 8px;
    box-shadow: ${shadows.modal};
    padding: 16px;
    gap: 12px;

    > h1 {
      font-size: 16px;
      font-family: ${fonts.decorative};
      color: ${colors.secondary.var};

      > .time {
        font-size: 11px;
        color: ${colors.white.alpha(0.5)};
        margin-left: 8px;
      }
    }

    > input {
      background: ${colors.white.alpha(0.05)};
      border: 1px solid ${colors.white.alpha(0.1)};
      border-radius: 4px;
      color: ${colors.white.var};
      font-size: 13px;
      padding: 7px 10px;

      &:focus {
        outline: 0;
        border-color: ${colors.primary.alpha(0.6)};
      }
    }

    > .actions {
      ${inline({ gap: 8, justify: 'right' })};
      padding-top: 4px;

      button {
        ${inline({ gap: 6 })};
        font-size: 13px;
        border-radius: 4px;
        padding: 6px 12px;
        background: ${colors.white.alpha(0.06)};
        --icon-size: 15px;

        &:hover {
          background: ${colors.white.alpha(0.12)};
        }

        &.primary {
          background: ${colors.primary.var};
          color: ${colors.bgPrimary.var};
          font-weight: 600;
        }
      }
    }
  }
`

export const AddMarkerDialog = () => {
  let label = $signal('')

  const markerTime = $(addMarkerDialogState.value?.time)

  function close() {
    addMarkerDialogState.value = null
  }

  function submit() {
    addMarker(label.trim() || undefined, markerTime)
    showToast('Marker added')
    close()
  }

  return (
    <div
      class={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          close()
        }
      }}
    >
      <div class={dialogStyle}>
        <h1>
          add marker
          {markerTime !== undefined && (
            <span class="time">
              at {dayjs(markerTime).format('HH:mm:ss.SSS')}
            </span>
          )}
        </h1>

        <input
          type="text"
          placeholder="Marker label (optional)"
          value={label}
          ref={(el) => {
            setTimeout(() => el.focus())
          }}
          onInput={(e) => {
            label = e.currentTarget.value
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submit()
            } else if (e.key === 'Escape') {
              e.stopPropagation()
              close()
            }
          }}
        />

        <div class="actions">
          <ButtonElement onClick={close}>Cancel</ButtonElement>

          <ButtonElement class="primary" onClick={submit}>
            <Icon name="flag" />
            Add marker
          </ButtonElement>
        </div>
      </div>
    </div>
  )
}
