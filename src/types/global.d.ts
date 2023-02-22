/// <reference types="vite/client" />

import * as oslu from 'oslu'

declare global {
  const watchValue: typeof oslu.watchValue
}
