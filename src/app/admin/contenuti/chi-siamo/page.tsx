import { getAboutContent } from '@/lib/site-content.server'
import AboutContentEditor from './AboutContentEditor'

export const dynamic = 'force-dynamic'

export default async function AdminAboutContentPage() {
  const content = await getAboutContent()

  return <AboutContentEditor initialContent={content} />
}