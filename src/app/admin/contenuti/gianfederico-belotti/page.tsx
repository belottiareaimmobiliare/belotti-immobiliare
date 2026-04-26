import { getGianfedericoBelottiContent } from '@/lib/site-content.server'
import GianfedericoBelottiContentEditor from './GianfedericoBelottiContentEditor'

export const dynamic = 'force-dynamic'

export default async function AdminGianfedericoBelottiContentPage() {
  const content = await getGianfedericoBelottiContent()

  return <GianfedericoBelottiContentEditor initialContent={content} />
}
