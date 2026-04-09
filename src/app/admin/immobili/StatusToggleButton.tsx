'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { togglePropertyStatus } from './actions'

type Props = {
  propertyId: string
  currentStatus: string
}

export default function StatusToggleButton({
  propertyId,
  currentStatus,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isPublished = currentStatus === 'published'

  const handleClick = () => {
    startTransition(async () => {
      try {
        await togglePropertyStatus(propertyId, currentStatus)
        router.refresh()
      } catch (error) {
        console.error(error)
        alert('Errore aggiornamento stato immobile')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] transition ${
        isPublished
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
          : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
      } disabled:opacity-60`}
    >
      {isPending ? 'Aggiorno...' : isPublished ? 'Published' : 'Draft'}
    </button>
  )
}