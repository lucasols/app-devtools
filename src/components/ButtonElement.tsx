/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { JSX } from 'solid-js'

const ButtonElement = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      {...props}
      onMouseDown={preventDefault}
    />
  )
}

export default ButtonElement

function preventDefault(e: any) {
  e.preventDefault()
}
