export type PropertySuggestion = Partial<{
  condition: string
  availability: string
  property_type: string
  rooms: string
  surface: string
  bathrooms: string
  bedrooms: string
  floor: string
  total_floors: string
  balconies: string
  terraces: string
  has_garage: boolean
  has_parking: boolean
  has_garden: boolean
  has_elevator: boolean
  heating_type: string
  heating_source: string
  furnished_status: string
  condo_fees: string
  condo_fees_amount: string
  condo_fees_period: string
}>

const WORD_NUMBERS: Record<string, number> = {
  uno: 1,
  una: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  primo: 1,
  prima: 1,
  secondo: 2,
  seconda: 2,
  terzo: 3,
  terza: 3,
  quarto: 4,
  quarta: 4,
  quinto: 5,
  quinta: 5,
  sesto: 6,
  sesta: 6,
  settimo: 7,
  settima: 7,
  ottavo: 8,
  ottava: 8,
  nono: 9,
  nona: 9,
  decimo: 10,
  decima: 10,
}

function normalizeText(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeText(term)))
}

function toNumber(value: string | undefined) {
  if (!value) return null
  const clean = value.toLowerCase().trim()
  const asNumber = Number(clean.replace(',', '.'))
  if (Number.isFinite(asNumber)) return asNumber
  return WORD_NUMBERS[clean] || null
}

function firstNumberFromPatterns(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const value = toNumber(match?.[1])
    if (value && value > 0) return value
  }

  return null
}

function extractSurface(text: string) {
  const matches = [...text.matchAll(/(\d{1,4}(?:[,.]\d+)?)\s*(?:mq|m²|metri quadri)\b/g)]

  for (const match of matches) {
    const value = toNumber(match[1])
    if (!value) continue

    const start = Math.max(0, (match.index || 0) - 30)
    const end = Math.min(text.length, (match.index || 0) + 60)
    const context = text.slice(start, end)

    if (context.includes('mq/euro') || context.includes('mq / euro')) continue
    if (value < 8 || value > 2000) continue

    return String(Math.round(value))
  }

  return null
}

function extractPropertyType(text: string) {
  if (hasAny(text, ['bilocale'])) return 'bilocale'
  if (hasAny(text, ['trilocale'])) return 'trilocale'
  if (hasAny(text, ['quadrilocale'])) return 'quadrilocale'
  if (hasAny(text, ['monolocale'])) return 'monolocale'
  if (hasAny(text, ['attico', 'super attico'])) return 'attico'
  if (hasAny(text, ['mansarda'])) return 'mansarda'
  if (hasAny(text, ['villa', 'villetta'])) return 'villa'
  if (hasAny(text, ['rustico', 'rudere'])) return 'rustico'

  if (hasAny(text, ['ufficio', 'uffici', 'centro direzionale', 'reception', 'sala riunione'])) {
    return 'ufficio'
  }

  if (hasAny(text, ['negozio', 'vetrine', 'bottega', 'fronte strada'])) {
    return 'negozio'
  }

  if (
    hasAny(text, ['box varie metrature', 'box singolo', 'box doppio', 'autorimessa']) ||
    /\bbox\s+(?:di\s+)?\d{1,4}\s*mq\b/.test(text)
  ) {
    return 'box'
  }

  if (hasAny(text, ['appartamento'])) return 'appartamento'

  return null
}

function extractRooms(text: string) {
  if (hasAny(text, ['monolocale'])) return '1'
  if (hasAny(text, ['bilocale'])) return '2'
  if (hasAny(text, ['trilocale'])) return '3'
  if (hasAny(text, ['quadrilocale'])) return '4'
  if (hasAny(text, ['oltre 5 locali'])) return '6'

  const explicit = firstNumberFromPatterns(text, [
    /\b(\d+)\s+locali\b/,
    /\b(\d+)\s+vani\b/,
    /\b(uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+locali\b/,
    /\b(uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+vani\b/,
  ])

  return explicit ? String(explicit) : null
}

function extractBedrooms(text: string) {
  const explicit = firstNumberFromPatterns(text, [
    /\b(\d+)\s+camere?\b/,
    /\b(uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+camere?\b/,
  ])

  if (explicit) return String(explicit)

  let count = 0

  if (hasAny(text, ['camera matrimoniale'])) count += 1
  if (hasAny(text, ['camera singola'])) count += 1
  if (hasAny(text, ['cameretta'])) count += 1
  if (hasAny(text, ['camera da letto'])) count += 1

  const unaCameraMatches = [...text.matchAll(/\buna camera\b/g)].length
  count += unaCameraMatches

  if (count > 0) return String(count)

  if (/\bcamera\b/.test(text)) return '1'

  return null
}

function extractBathrooms(text: string) {
  const explicit = firstNumberFromPatterns(text, [
    /\b(\d+)\s+bagni?\b/,
    /\b(\d+)\s+servizi\b/,
    /\b(uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+bagni?\b/,
    /\b(uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+servizi\b/,
  ])

  if (explicit) return String(explicit)

  if (hasAny(text, ['doppi servizi', 'doppio servizio'])) return '2'

  const bathroomMentions = [...text.matchAll(/\bbagno\b/g)].length
  if (bathroomMentions > 0) return String(bathroomMentions)

  return null
}

function extractInternalLevels(text: string) {
  if (hasAny(text, ['su due livelli', 'su due piani', 'disposto su due livelli'])) return '2'
  if (hasAny(text, ['su tre livelli', 'su 3 livelli', 'su tre piani', 'su 3 piani'])) return '3'
  if (hasAny(text, ['su quattro livelli', 'su 4 livelli', 'su quattro piani', 'su 4 piani'])) return '4'

  const explicit = firstNumberFromPatterns(text, [
    /\bsu\s+(\d+)\s+livelli\b/,
    /\bsu\s+(\d+)\s+piani\b/,
    /\bsu\s+(due|tre|quattro|cinque)\s+livelli\b/,
    /\bsu\s+(due|tre|quattro|cinque)\s+piani\b/,
  ])

  return explicit ? String(explicit) : null
}

function extractFloor(text: string, totalFloors: string | null) {
  const hasInternalDistribution =
    Boolean(totalFloors) &&
    (
      /piano terra.+piano primo/.test(text) ||
      /primo piano.+secondo piano/.test(text) ||
      /al primo piano.+al secondo piano/.test(text) ||
      /piano terra.+primo piano/.test(text)
    )

  if (hasInternalDistribution) return null

  if (hasAny(text, ['piano rialzato'])) return 'rialzato'
  if (hasAny(text, ['piano terra'])) return 'terra'

  const numberFloor = firstNumberFromPatterns(text, [
    /\b(?:posto|situato)?\s*(?:al|a)?\s*(\d+)[°º]?\s*(?:e|ed)?\s*(?:ultimo\s*)?piano\b/,
    /\b(\d+)\s*(?:e|ed)\s*ultimo piano\b/,
  ])

  if (numberFloor) return String(numberFloor)

  const wordFloor = firstNumberFromPatterns(text, [
    /\bpiano\s+(primo|secondo|terzo|quarto|quinto|sesto|settimo|ottavo|nono|decimo)\b/,
    /\bal\s+(primo|secondo|terzo|quarto|quinto|sesto|settimo|ottavo|nono|decimo)\s+piano\b/,
  ])

  if (wordFloor) return String(wordFloor)

  if (hasAny(text, ['ultimo piano'])) return 'ultimo'

  return null
}

function extractBalconies(text: string) {
  const explicit = firstNumberFromPatterns(text, [
    /\b(\d+)\s+balconi\b/,
    /\b(\d+)\s+balcone\b/,
    /\b(uno|una|due|tre|quattro|cinque|sei)\s+balconi\b/,
  ])

  if (explicit) return String(explicit)
  if (hasAny(text, ['balcone', 'balconi'])) return '1'

  return null
}

function extractTerraces(text: string) {
  const explicit = firstNumberFromPatterns(text, [
    /\b(\d+)\s+terrazzi\b/,
    /\b(\d+)\s+terrazze\b/,
    /\b(\d+)\s+terrazzo\b/,
    /\b(\d+)\s+terrazza\b/,
    /\b(uno|una|due|tre|quattro|cinque|sei)\s+terrazzi\b/,
    /\b(uno|una|due|tre|quattro|cinque|sei)\s+terrazze\b/,
  ])

  if (explicit) return String(explicit)
  if (hasAny(text, ['terrazzo', 'terrazza', 'terrazzi', 'terrazze'])) return '1'

  return null
}

function extractCondoFees(text: string, suggestions: PropertySuggestion) {
  if (!text.includes('spese condominiali') && !text.includes('basse spese')) return

  if (hasAny(text, ['spese condominiali incluse', 'spese incluse', 'spese comprese'])) {
    suggestions.condo_fees = 'Incluse'
  } else if (hasAny(text, ['basse spese condominiali', 'spese condominiali basse', 'bassissime spese'])) {
    suggestions.condo_fees = 'Basse'
  } else {
    suggestions.condo_fees = 'Presenti'
  }

  const amountMatch = text.match(/spese(?:\s+condominiali)?[^0-9]{0,80}(\d{1,4})(?:[,.]\d{1,2})?\s*(?:€|euro)?\s*(?:\/\s*)?(mese|mensili|mensile|anno|annue|annuali)?/)
  const amount = toNumber(amountMatch?.[1])

  if (amount) {
    suggestions.condo_fees_amount = String(Math.round(amount))
  }

  const period = amountMatch?.[2]
  if (period) {
    suggestions.condo_fees_period = period.includes('ann') || period.includes('anno') ? 'anno' : 'mese'
  }
}

export function analyzePropertyDescription(description: string): PropertySuggestion {
  const text = normalizeText(description)
  const suggestions: PropertySuggestion = {}

  if (!text) return suggestions

  const propertyType = extractPropertyType(text)
  const rooms = extractRooms(text)
  const surface = extractSurface(text)
  const bedrooms = extractBedrooms(text)
  const bathrooms = extractBathrooms(text)
  const totalFloors = extractInternalLevels(text)
  const floor = extractFloor(text, totalFloors)
  const balconies = extractBalconies(text)
  const terraces = extractTerraces(text)

  if (propertyType) suggestions.property_type = propertyType
  if (rooms) suggestions.rooms = rooms
  if (surface) suggestions.surface = surface
  if (bedrooms) suggestions.bedrooms = bedrooms
  if (bathrooms) suggestions.bathrooms = bathrooms
  if (totalFloors) suggestions.total_floors = totalFloors
  if (floor) suggestions.floor = floor
  if (balconies) suggestions.balconies = balconies
  if (terraces) suggestions.terraces = terraces

  if (hasAny(text, ['da ristrutturare', 'da restaurare', 'necessita di restauro', 'tetto ammalorato'])) {
    suggestions.condition = 'da_ristrutturare'
  } else if (hasAny(text, ['ristrutturato', 'completamente ristrutturato', 'totalmente ristrutturato'])) {
    suggestions.condition = 'ristrutturato'
  } else if (hasAny(text, [
    'nuova costruzione',
    'di nuova costruzione',
    'nuova realizzazione',
    'di nuova realizzazione',
    'nuovo mai abitato',
    'mai abitato',
    'in costruzione',
    'recentissimo edificio',
    'recente costruzione',
    'di recente costruzione',
    'costruzione recente',
  ])) {
    suggestions.condition = 'nuovo'
  } else if (hasAny(text, ['ottimo stato', 'ottime condizioni', 'ottime condizioni manutentive'])) {
    suggestions.condition = 'ottimo'
  } else if (hasAny(text, ['buono stato', 'buone condizioni'])) {
    suggestions.condition = 'buono'
  } else if (hasAny(text, ['abitabile', 'pronto per essere abitato'])) {
    suggestions.condition = 'abitabile'
  }

  if (hasAny(text, ['libero subito', 'subito disponibile'])) {
    suggestions.availability = 'libero_subito'
  } else if (hasAny(text, ['libero al rogito'])) {
    suggestions.availability = 'al_rogito'
  } else if (hasAny(text, ['locato', 'gia a reddito', 'a reddito'])) {
    suggestions.availability = 'locato'
  } else if (hasAny(text, ['occupato'])) {
    suggestions.availability = 'occupato'
  }

  const hasZeroGarage = /\b0\s+garage\b/.test(text)

  if (
    !hasZeroGarage &&
    hasAny(text, ['box', 'box auto', 'box singolo', 'box doppio', 'autorimessa', 'garage'])
  ) {
    suggestions.has_garage = true
  }

  if (hasAny(text, ['posto auto', 'posti auto', 'parcheggio', 'posti auto coperti'])) {
    suggestions.has_parking = true
  }

  if (hasAny(text, ['giardino', 'giardinetto', 'giardino privato', 'parco privato'])) {
    suggestions.has_garden = true
  }

  if (hasAny(text, ['ascensore']) && !hasAny(text, ['senza ascensore', 'no ascensore'])) {
    suggestions.has_elevator = true
  }

  if (hasAny(text, ['riscaldamento autonomo', 'termoautonomo', 'autonomo'])) {
    suggestions.heating_type = 'termoautonomo'
  } else if (hasAny(text, ['riscaldamento centralizzato', 'centralizzato'])) {
    suggestions.heating_type = 'centralizzato'
  } else if (hasAny(text, ['riscaldamento a pavimento'])) {
    suggestions.heating_type = 'a_pavimento'
  }

  if (hasAny(text, ['pompa di calore', 'caldo/freddo', 'aria cond. con pompa di calore'])) {
    suggestions.heating_source = 'pompa_calore'
  } else if (hasAny(text, ['metano'])) {
    suggestions.heating_source = 'metano'
  } else if (hasAny(text, ['gasolio'])) {
    suggestions.heating_source = 'gasolio'
  } else if (hasAny(text, ['teleriscaldamento'])) {
    suggestions.heating_source = 'teleriscaldamento'
  } else if (hasAny(text, ['stufa a pellet', 'pellet'])) {
    suggestions.heating_source = 'stufa_pellet'
  } else if (hasAny(text, ['elettrico', 'elettrica'])) {
    suggestions.heating_source = 'elettrico'
  } else if (hasAny(text, ['a pavimento', 'pavimento'])) {
    suggestions.heating_source = 'pavimento'
  } else if (hasAny(text, ['gas'])) {
    suggestions.heating_source = 'gas'
  }

  if (hasAny(text, ['non arredato', 'non ammobiliato'])) {
    suggestions.furnished_status = 'no'
  } else if (hasAny(text, ['parzialmente arredato', 'parzialmente ammobiliato'])) {
    suggestions.furnished_status = 'parzialmente'
  } else if (hasAny(text, ['ben arredato', 'arredato', 'ammobiliato', 'ammobiliata', 'completamente ammobiliata'])) {
    suggestions.furnished_status = 'si'
  }

  extractCondoFees(text, suggestions)

  return suggestions
}
