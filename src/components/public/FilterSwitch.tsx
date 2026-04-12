'use client'

type Props = {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}

export default function FilterSwitch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="theme-pill flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left text-sm transition"
    >
      <span className="text-[var(--site-text-soft)]">{label}</span>

      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-all duration-200 ${
          checked
            ? 'border-[var(--site-gold)] bg-[var(--site-gold)]'
            : 'border-[var(--site-border-strong)] bg-[var(--site-surface-2)]'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full shadow transition-all duration-200 ${
            checked
              ? 'left-6 bg-[#0b0f17]'
              : 'left-1 bg-white'
          }`}
        />
      </span>
    </button>
  )
}