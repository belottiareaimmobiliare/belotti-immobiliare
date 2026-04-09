'use client'

type FilterSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export default function FilterSwitch({
  checked,
  onChange,
  label,
}: FilterSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
      aria-pressed={checked}
    >
      <span>{label}</span>

      <span
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
          checked ? 'bg-white' : 'bg-white/15'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full transition ${
            checked
              ? 'translate-x-6 bg-black'
              : 'translate-x-1 bg-white'
          }`}
        />
      </span>
    </button>
  )
}