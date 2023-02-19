import {
  easings,
  TransitionDurations,
  transitionDurations,
  TransitionEasings,
} from '@src/style/helpers/transition'

export const fadeIn = ({
  duration = 'medium',
  ease = 'linear',
}: {
  opacity?: number
  duration?: TransitionDurations | number
  ease?: TransitionEasings
} = {}) => `
  animation: ${
    typeof duration === 'number'
      ? duration
      : transitionDurations[duration || 'medium']
  }ms
    ${easings[ease]} fade;

  @keyframes fade {
    from {
      opacity: 0;
    }
  }
`
