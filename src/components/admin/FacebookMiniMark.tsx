type FacebookMiniMarkProps = {
  className?: string
  title?: string
  decorative?: boolean
}

export default function FacebookMiniMark({
  className = '',
  title = 'Facebook',
  decorative = true,
}: FacebookMiniMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : title}
      fill="none"
    >
      {!decorative ? <title>{title}</title> : null}
      <circle cx="16" cy="16" r="16" fill="#1877F2" />
      <path
        d="M18.12 26V17.24H21.06L21.5 13.82H18.12V11.64C18.12 10.65 18.4 9.97 19.82 9.97H21.62V6.91C21.31 6.86 20.24 6.78 18.99 6.78C16.38 6.78 14.6 8.37 14.6 11.31V13.82H11.75V17.24H14.6V26H18.12Z"
        fill="white"
      />
    </svg>
  )
}
