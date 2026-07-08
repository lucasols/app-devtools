import { RequestSubTypes, RequestTypes } from '@src/stores/callsStore'
import { colors, fonts } from '@src/style/theme'
import { css } from 'solid-styled-components'

export const typeTagStyle = css`
  font-size: 10px;
  font-family: ${fonts.decorative};
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
  padding: 1px 4px;
  flex-shrink: 0;
  color: ${colors.white.alpha(0.85)};
  background: ${colors.white.alpha(0.12)};

  &.get {
    color: ${colors.secondary.var};
    background: ${colors.secondary.alpha(0.14)};
  }

  &.post {
    color: ${colors.success.var};
    background: ${colors.success.alpha(0.14)};
  }

  &.put,
  &.patch {
    color: ${colors.warning.var};
    background: ${colors.warning.alpha(0.14)};
  }

  &.delete {
    color: ${colors.error.var};
    background: ${colors.error.alpha(0.14)};
  }

  &.mutation {
    color: #a78bfa;
    background: rgba(167, 139, 250, 0.14);
  }

  &.ws-send {
    color: ${colors.primary.var};
    background: ${colors.primary.alpha(0.14)};
  }

  &.ws-receive {
    color: ${colors.secondary.var};
    background: ${colors.secondary.alpha(0.14)};
  }
`

const methodClasses = ['get', 'post', 'put', 'patch', 'delete']

/**
 * label and color class of the tag shown before request/call names, e.g.
 * the http method for api requests or the direction for ws events
 */
export function getTypeTag({
  type,
  subType,
  method,
}: {
  type: RequestTypes
  subType: RequestSubTypes | undefined
  method: string | undefined
}): { label: string; class: string; description: string } {
  if (type === 'ws') {
    return subType === 'send'
      ? { label: '↑ send', class: 'ws-send', description: 'websocket (send)' }
      : {
          label: '↓ recv',
          class: 'ws-receive',
          description: 'websocket (receive)',
        }
  }

  if (method) {
    const normalizedMethod = method.toLowerCase()

    return {
      label: method,
      class: methodClasses.includes(normalizedMethod) ? normalizedMethod : '',
      description: `${type} (${method})`,
    }
  }

  if (type === 'mutation') {
    if (subType === 'create') {
      return { label: 'create', class: 'post', description: 'mutation (create)' }
    }

    if (subType === 'update') {
      return { label: 'update', class: 'put', description: 'mutation (update)' }
    }

    if (subType === 'delete') {
      return {
        label: 'delete',
        class: 'delete',
        description: 'mutation (delete)',
      }
    }

    return {
      label: subType || 'mut',
      class: 'mutation',
      description: `mutation${subType ? ` (${subType})` : ''}`,
    }
  }

  return { label: 'fetch', class: '', description: 'fetch' }
}
