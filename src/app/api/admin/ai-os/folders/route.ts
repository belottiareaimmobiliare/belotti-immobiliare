import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError, mapPropertyToAIOSFolder } from '@/lib/ai-os'

type FolderVisualState = 'off' | 'blue' | 'green' | 'yellow' | 'red'

const EXPECTED_CHECKLIST_ITEMS = 8
const EXPECTED_OWNER_DOCUMENTS = 6

function incrementMap(map: Map<string, number>, propertyId: string, amount = 1) {
  if (!propertyId) return
  map.set(propertyId, (map.get(propertyId) ?? 0) + amount)
}

function setReason(map: Map<string, string>, propertyId: string, reason: string) {
  if (!propertyId) return
  if (!map.has(propertyId)) {
    map.set(propertyId, reason)
  }
}

export async function GET() {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .limit(300)

    if (error) {
      console.error('AI-OS folders error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const propertyIds = (data ?? [])
      .map((property) => String(property.id ?? ''))
      .filter(Boolean)

    const fileCounts = new Map<string, number>()
    const ownerCounts = new Map<string, number>()
    const mandateCounts = new Map<string, number>()
    const mandateActiveCounts = new Map<string, number>()
    const checklistDoneCounts = new Map<string, number>()
    const checklistTouchedCounts = new Map<string, number>()
    const ownerDocsGoodCounts = new Map<string, number>()
    const ownerDocsTouchedCounts = new Map<string, number>()
    const driveCounts = new Map<string, number>()

    const hasRed = new Map<string, boolean>()
    const hasYellow = new Map<string, boolean>()
    const reason = new Map<string, string>()

    if (propertyIds.length > 0) {
      const { data: filesCountData, error: filesCountError } = await supabase
        .from('ai_os_files')
        .select('property_id')
        .eq('is_deleted', false)
        .in('property_id', propertyIds)
        .limit(20000)

      if (filesCountError) {
        console.error('AI-OS folder file counts error:', filesCountError)
      } else {
        for (const file of filesCountData ?? []) {
          incrementMap(fileCounts, String(file.property_id ?? ''))
        }
      }

      const { data: ownersData, error: ownersError } = await supabase
        .from('property_owners')
        .select('property_id')
        .in('property_id', propertyIds)
        .limit(10000)

      if (ownersError) {
        console.error('AI-OS folder owners status error:', ownersError)
      } else {
        for (const owner of ownersData ?? []) {
          incrementMap(ownerCounts, String(owner.property_id ?? ''))
        }
      }

      const { data: documentRequestsData, error: documentRequestsError } = await supabase
        .from('property_document_requests')
        .select('property_id, status')
        .in('property_id', propertyIds)
        .limit(10000)

      if (documentRequestsError) {
        console.error('AI-OS folder document requests status error:', documentRequestsError)
      } else {
        for (const request of documentRequestsData ?? []) {
          const propertyId = String(request.property_id ?? '')
          const status = String(request.status ?? '')

          if (status === 'cancelled') {
            hasRed.set(propertyId, true)
            setReason(reason, propertyId, 'Richiesta documento annullata')
          }

          if (status === 'todo' || status === 'working') {
            hasYellow.set(propertyId, true)
            setReason(reason, propertyId, 'Visure/documenti in attesa')
          }
        }
      }

      const { data: ownerDocumentsData, error: ownerDocumentsError } = await supabase
        .from('property_owner_documents')
        .select('property_id, status')
        .in('property_id', propertyIds)
        .limit(10000)

      if (ownerDocumentsError) {
        console.error('AI-OS folder owner documents status error:', ownerDocumentsError)
      } else {
        for (const document of ownerDocumentsData ?? []) {
          const propertyId = String(document.property_id ?? '')
          const status = String(document.status ?? '')

          incrementMap(ownerDocsTouchedCounts, propertyId)

          if (status === 'verified' || status === 'not_needed') {
            incrementMap(ownerDocsGoodCounts, propertyId)
          }

          if (status === 'missing' || status === 'received') {
            hasYellow.set(propertyId, true)
            setReason(reason, propertyId, 'Documenti proprietario da completare')
          }
        }
      }

      const { data: checklistData, error: checklistError } = await supabase
        .from('property_checklist_items')
        .select('property_id, is_done')
        .in('property_id', propertyIds)
        .limit(10000)

      if (checklistError) {
        console.error('AI-OS folder checklist status error:', checklistError)
      } else {
        for (const item of checklistData ?? []) {
          const propertyId = String(item.property_id ?? '')
          incrementMap(checklistTouchedCounts, propertyId)

          if (item.is_done === true) {
            incrementMap(checklistDoneCounts, propertyId)
          }
        }
      }

      const { data: mandatesData, error: mandatesError } = await supabase
        .from('property_mandates')
        .select('property_id, status')
        .in('property_id', propertyIds)
        .limit(10000)

      if (mandatesError) {
        console.error('AI-OS folder mandates status error:', mandatesError)
      } else {
        for (const mandate of mandatesData ?? []) {
          const propertyId = String(mandate.property_id ?? '')
          const status = String(mandate.status ?? '')

          incrementMap(mandateCounts, propertyId)

          if (status === 'active') {
            incrementMap(mandateActiveCounts, propertyId)
          }

          if (status === 'expired') {
            hasRed.set(propertyId, true)
            setReason(reason, propertyId, 'Incarico scaduto')
          }
        }
      }

      const { data: driveData, error: driveError } = await supabase
        .from('property_drive_folders')
        .select('property_id')
        .in('property_id', propertyIds)
        .limit(10000)

      if (driveError) {
        console.error('AI-OS folder drive status error:', driveError)
      } else {
        for (const drive of driveData ?? []) {
          incrementMap(driveCounts, String(drive.property_id ?? ''))
        }
      }
    }

    const folders = (data ?? [])
      .map((property) => {
        const folder = mapPropertyToAIOSFolder(property as Record<string, unknown>)
        const propertyId = folder.id

        const fileCount = fileCounts.get(propertyId) ?? 0
        const ownerCount = ownerCounts.get(propertyId) ?? 0
        const mandateCount = mandateCounts.get(propertyId) ?? 0
        const mandateActiveCount = mandateActiveCounts.get(propertyId) ?? 0
        const checklistDoneCount = checklistDoneCounts.get(propertyId) ?? 0
        const checklistTouchedCount = checklistTouchedCounts.get(propertyId) ?? 0
        const ownerDocsGoodCount = ownerDocsGoodCounts.get(propertyId) ?? 0
        const ownerDocsTouchedCount = ownerDocsTouchedCounts.get(propertyId) ?? 0
        const driveCount = driveCounts.get(propertyId) ?? 0

        let visualState: FolderVisualState = 'off'
        let visualReason = 'Cartella vuota o senza dati operativi'

        const hasAnyData =
          fileCount > 0 ||
          ownerCount > 0 ||
          mandateCount > 0 ||
          checklistTouchedCount > 0 ||
          ownerDocsTouchedCount > 0 ||
          driveCount > 0

        const checklistComplete = checklistDoneCount >= EXPECTED_CHECKLIST_ITEMS
        const ownerDocsComplete =
          ownerDocsTouchedCount >= EXPECTED_OWNER_DOCUMENTS &&
          ownerDocsGoodCount >= EXPECTED_OWNER_DOCUMENTS

        if (hasRed.get(propertyId)) {
          visualState = 'red'
          visualReason = reason.get(propertyId) ?? 'Criticità da verificare'
        } else if (hasYellow.get(propertyId)) {
          visualState = 'yellow'
          visualReason = reason.get(propertyId) ?? 'Documentazione in attesa'
        } else if (
          hasAnyData &&
          ownerCount > 0 &&
          fileCount > 0 &&
          checklistComplete &&
          ownerDocsComplete &&
          mandateActiveCount > 0
        ) {
          visualState = 'green'
          visualReason = 'Fascicolo molto completo'
        } else if (hasAnyData) {
          visualState = 'blue'
          visualReason = 'Cartella popolata ma non ancora completa'
        }

        return {
          ...folder,
          fileCount,
          visualState,
          visualReason,
          statusStats: {
            fileCount,
            ownerCount,
            mandateCount,
            mandateActiveCount,
            checklistDoneCount,
            checklistExpectedCount: EXPECTED_CHECKLIST_ITEMS,
            ownerDocsGoodCount,
            ownerDocsExpectedCount: EXPECTED_OWNER_DOCUMENTS,
            driveCount,
          },
        }
      })
      .filter((folder) => folder.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'it'))

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('AI-OS folders exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento cartelle AI-OS') },
      { status: 500 },
    )
  }
}
