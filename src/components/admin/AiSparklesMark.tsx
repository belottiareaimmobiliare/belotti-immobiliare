import type { CSSProperties } from 'react'

type AiSparklesMarkProps = {
  className?: string
  style?: CSSProperties
  title?: string
  decorative?: boolean
}

export default function AiSparklesMark({
  className = '',
  style,
  title = 'AI',
  decorative = true,
}: AiSparklesMarkProps) {
  return (
    <svg
      viewBox="0 0 260 170"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : title}
      fill="none"
    >
      {!decorative ? <title>{title}</title> : null}

      <g fill="currentColor">
        <path d="M40 8c5.2 21 12.8 28.6 33.8 33.8C52.8 47 45.2 54.6 40 75.6 34.8 54.6 27.2 47 6.2 41.8 27.2 36.6 34.8 29 40 8Z" />
        <path d="M25 75c3.5 14.2 8.5 19.2 22.7 22.7C33.5 101.2 28.5 106.2 25 120.4 21.5 106.2 16.5 101.2 2.3 97.7 16.5 94.2 21.5 89.2 25 75Z" />
        <path d="M54 118c2.4 9.8 5.8 13.2 15.6 15.6-9.8 2.4-13.2 5.8-15.6 15.6-2.4-9.8-5.8-13.2-15.6-15.6 9.8-2.4 13.2-5.8 15.6-15.6Z" />

        <path d="M105 30h43.5L187 142h-32.2l-6.8-22.4h-43.6L97.6 142H67L105 30Zm21.8 29.2-14.1 38.9h28.2l-14.1-38.9Z" />
        <path d="M197 30h31v112h-31V30Z" />
      </g>
    </svg>
  )
}
