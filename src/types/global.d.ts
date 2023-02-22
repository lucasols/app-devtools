/// <reference types="vite/client" />
/// <reference types="babel-plugin-solid-labels" />

import * as oslu from 'oslu'

declare global {
  const watchValue: typeof oslu.watchValue
}
