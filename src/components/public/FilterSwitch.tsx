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
      className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-left text-sm text-[var(--site-text-soft)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-2)]"
    >
      <span>{label}</span>

      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition ${
          checked
            ? 'border-[var(--site-gold)] bg-[var(--site-gold)]'
            : 'border-[var(--site-border-strong)] bg-[var(--site-surface-2)]'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full border transition ${
            checked
              ? 'left-6 border-[#0b0f17] bg-[#0b0f17] shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
              : 'left-1 border-[var(--site-border-strong)] bg-[var(--site-bg)] shadow-[0_2px_8px_rgba(0,0,0,0.18)]'
          }`}
        />
      </span>
    </button>
  )
}
