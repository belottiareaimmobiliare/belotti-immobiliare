import LogoutButton from './LogoutButton'

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          Admin Panel
        </p>
        <h1 className="mt-1 text-lg font-semibold text-white">
          BELOTTI - Area Immobiliare
        </h1>
      </div>

      <LogoutButton />
    </header>
  )
}