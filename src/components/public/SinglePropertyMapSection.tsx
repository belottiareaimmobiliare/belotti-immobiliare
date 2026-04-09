'use client'

import dynamic from 'next/dynamic'

const SinglePropertyMap = dynamic(
  () => import('@/components/public/SinglePropertyMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-white/10 bg-black/20 text-sm text-white/45">
        Caricamento mappa...
      </div>
    ),
  }
)

type Props = {
  title: string | null
  comune: string | null
  province: string | null
  price: number | null
  latitude: number | null
  longitude: number | null
  locationMode: string | null
}

export default function SinglePropertyMapSection(props: Props) {
  return <SinglePropertyMap {...props} />
}