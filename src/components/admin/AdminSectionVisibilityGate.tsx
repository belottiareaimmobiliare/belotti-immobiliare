import { requireAdminProfile } from '@/lib/admin-auth'
import AdminSectionVisibilityToggle from './AdminSectionVisibilityToggle'

export default async function AdminSectionVisibilityGate() {
  const profile = await requireAdminProfile()

  if (profile.role !== 'administrator') {
    return null
  }

  return <AdminSectionVisibilityToggle />
}
