'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

type LeadStatus = 'new' | 'read' | 'contacted' | 'closed'

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const profile = await requireAdminProfile()

  if (profile.role !== 'owner' && !profile.can_manage_properties) {
    throw new Error('Non autorizzato')
  }

  const service = createServiceClient()

  const { error } = await service
    .from('leads')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/leads')
}
