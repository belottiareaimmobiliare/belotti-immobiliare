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
      className="flex w-full items-center justify-between rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-3 text-left transition hover:bg-[var(--site-surface-3)]"
      aria-pressed={checked}
    >
      <span className="text-sm font-medium text-[var(--site-text)]">
        {label}
      </span>

      <span
        className={`relative h-7 w-12 rounded-full border transition ${
          checked
            ? 'border-[var(--site-accent)] bg-[var(--site-accent)]/20'
            : 'border-[var(--site-border)] bg-[var(--site-surface)]'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full transition ${
            checked
              ? 'left-6 bg-[var(--site-accent)] shadow-[0_0_0_1px_rgba(0,0,0,0.04)]'
              : 'left-1 bg-[var(--site-text)]/88'
          }`}
        />
      </span>
    </button>
  )
}