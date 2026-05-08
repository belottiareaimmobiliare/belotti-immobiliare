import { requireAdminProfile } from '@/lib/admin-auth'
import AdminSectionVisibilityToggle from './AdminSectionVisibilityToggle'

export default async function AdminSectionVisibilityGate() {
  const profile = await requireAdminProfile()
  const role = String(profile.role)

  if (role !== 'administrator') {
    return null
  }

  return <AdminSectionVisibilityToggle />
}
