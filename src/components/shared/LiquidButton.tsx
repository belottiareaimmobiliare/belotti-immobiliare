'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  active?: boolean
}

export default function LiquidButton({
  children,
  className = '',
  active = false,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`liquid-button rounded-full border px-5 py-3 font-medium ${active ? 'is-active' : ''} ${className}`}
      {...props}
    >
      <span>{children}</span>
    </button>
  )
}