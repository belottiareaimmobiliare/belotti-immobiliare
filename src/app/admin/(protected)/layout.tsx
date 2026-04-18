import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminProtectedShell from '@/components/admin/AdminProtectedShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return <AdminProtectedShell>{children}</AdminProtectedShell>
}