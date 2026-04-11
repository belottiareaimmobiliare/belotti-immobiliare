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
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] transition disabled:opacity-60 ${
        isPublished
          ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-300'
          : 'border-amber-500/30 bg-amber-500/12 text-amber-300'
      }`}
    >
      {isPending ? 'Aggiorno...' : isPublished ? 'Published' : 'Draft'}
    </button>
  )
}