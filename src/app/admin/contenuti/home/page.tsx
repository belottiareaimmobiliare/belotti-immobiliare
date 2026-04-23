import { getHomeContent } from '@/lib/site-content.server'
import HomeContentEditor from './HomeContentEditor'

export const dynamic = 'force-dynamic'

export default async function AdminHomeContentPage() {
  const content = await getHomeContent()

  return <HomeContentEditor initialContent={content} />
}