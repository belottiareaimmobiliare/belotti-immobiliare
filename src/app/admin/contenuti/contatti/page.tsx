import { getContactsContent } from '@/lib/site-content.server'
import ContactsContentEditor from './ContactsContentEditor'

export const dynamic = 'force-dynamic'

export default async function AdminContactsContentPage() {
  const content = await getContactsContent()
  return <ContactsContentEditor initialContent={content} />
}
