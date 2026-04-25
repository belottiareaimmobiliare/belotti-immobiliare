export async function getCurrentAdminUserId() {
  const res = await fetch('/api/admin/me', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!res.ok) return null

  const data = await res.json()
  return data?.profile?.id || null
}
