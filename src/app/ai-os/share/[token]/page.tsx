import AIOSShareUploadClient from '@/components/ai-os/AIOSShareUploadClient'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{
    token: string
  }>
}

export default async function AIOSSharePage({ params }: PageProps) {
  const { token } = await params

  return <AIOSShareUploadClient token={token} />
}
