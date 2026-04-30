type PropertySuggestion = Record<string, string | boolean>

const NUMBER_WORDS: Record<string, number> = {
  uno: 1,
  una: 1,
  un: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
}

const FLOOR_WORDS: Record<string, string> = {
  primo: '1',
  seconda: '2',
  secondo: '2',
  terza: '3',
  terzo: '3',
  quarta: '4',
  quarto: '4',
  quinta: '5',
  quinto: '5',
  sesta: '6',
  sesto: '6',
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(normalize(word)))
}

function matchAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text))
}

function numberFromText(value: string | undefined) {
  if (!value) return null

  const clean = normalize(value)
  const numeric = Number(clean)

  if (Number.isFinite(numeric)) return numeric

  return NUMBER_WORDS[clean] ?? null
}

function extractNumberNear(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const raw = match?.[1]
    const number = numberFromText(raw)

    if (number !== null) return String(number)
  }

  return null
}

function hasNegativeFeature(text: string, featurePatterns: string[]) {
  return featurePatterns.some((feature) => {
    const pattern = new RegExp(
      `(senza|no|non presente|assente|privo di|priva di|mancanza di)\\s.{0,20}${feature}`,
      'i'
    )

    return pattern.test(text)
  })
}

function hasPositiveFeature(text: string, positiveWords: string[], negativeFeatures: string[]) {
  if (hasNegativeFeature(text, negativeFeatures)) return false
  return hasAny(text, positiveWords)
}

function extractSurface(text: string) {
  return extractNumberNear(text, [
    /(\d{2,4})\s*(mq|m2|metri quadrati)/,
    /(mq|m2|metri quadrati)\s*(\d{2,4})/,
    /superficie[^0-9]{0,30}(\d{2,4})/,
  ])
}

function extractFloor(text: string) {
  if (matchAny(text, [/piano\s+terra/, /\bp\.?\s*t\.?\b/, /\bpt\b/])) return 'Piano terra'
  if (hasAny(text, ['piano rialzato', 'rialzato'])) return 'Rialzato'
  if (hasAny(text, ['seminterrato', 'piano seminterrato'])) return 'Seminterrato'
  if (hasAny(text, ['ultimo piano'])) return 'Ultimo piano'

  const numericFloor = text.match(/(?:al|a|piano|posto al|sito al)\s*(\d{1,2})\s*(?:°|o)?\s*piano/)
  if (numericFloor?.[1]) return numericFloor[1]

  for (const [word, value] of Object.entries(FLOOR_WORDS)) {
    if (text.includes(`${word} piano`) || text.includes(`al ${word}`)) {
      return value
    }
  }

  return null
}

function extractTotalFloors(text: string) {
  const explicitLevels = text.match(/(?:su|disposto su|sviluppato su|articolato su)\s*(\d+|uno|una|due|tre|quattro|cinque)\s*(livelli|piani)/)
  const explicitFloors = text.match(/(?:totale piani|piani totali|numero piani)\s*(\d+|uno|una|due|tre|quattro|cinque)/)

  const levelNumber =
    numberFromText(explicitLevels?.[1]) ??
    numberFromText(explicitFloors?.[1])

  if (levelNumber !== null) return String(levelNumber)

  if (hasAny(text, [
    'su due livelli',
    'disposto su due livelli',
    'sviluppato su due livelli',
    'articolato su due livelli',
    'su 2 livelli',
    'su due piani',
    'su 2 piani',
  ])) {
    return '2'
  }

  if (hasAny(text, [
    'su tre livelli',
    'disposto su tre livelli',
    'sviluppato su tre livelli',
    'articolato su tre livelli',
    'su 3 livelli',
    'su tre piani',
    'su 3 piani',
  ])) {
    return '3'
  }

  if (hasAny(text, [
    'su quattro livelli',
    'disposto su quattro livelli',
    'sviluppato su quattro livelli',
    'articolato su quattro livelli',
    'su 4 livelli',
    'su quattro piani',
    'su 4 piani',
  ])) {
    return '4'
  }

  return null
}

function splitSentences(text: string) {
  return text
    .split(/[.;:\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function extractBathrooms(text: string) {
  if (hasAny(text, ['doppi servizi', 'doppio servizio'])) return '2'

  const explicit = extractNumberNear(text, [
    /(\d+|uno|una|due|tre|quattro|cinque)\s*(bagni|bagno|servizi|servizio)/,
    /(bagni|bagno|servizi|servizio)\s*(\d+)/,
  ])

  if (explicit) return explicit

  if (
    hasAny(text, [
      'secondo bagno',
      'altro bagno',
      'ulteriore bagno',
      'bagno padronale e bagno di servizio',
      'bagno di servizio e bagno padronale',
    ])
  ) {
    return '2'
  }

  const sentences = splitSentences(text)
  const bathroomSentences = sentences.filter((sentence) =>
    /\bbagno\b|\bbagni\b|\bservizio\b|\bservizi\b/.test(sentence)
  )

  const floorBathroomMarkers = new Set<string>()

  bathroomSentences.forEach((sentence) => {
    const floor = extractFloor(sentence)
    if (floor) floorBathroomMarkers.add(floor)
  })

  if (floorBathroomMarkers.size >= 2) return String(floorBathroomMarkers.size)

  const bathroomOccurrences = (text.match(/\bbagno\b|\bbagni\b|\bservizio\b|\bservizi\b/g) || []).length

  if (bathroomOccurrences >= 2 && matchAny(text, [
    /bagno[^.]{0,80}bagno/,
    /servizio[^.]{0,80}servizio/,
    /bagno[^.]{0,80}servizio/,
    /servizio[^.]{0,80}bagno/,
  ])) {
    return '2'
  }

  if (bathroomOccurrences >= 1) return '1'

  return null
}

function extractBedrooms(text: string) {
  const explicit = extractNumberNear(text, [
    /(\d+|una|uno|due|tre|quattro|cinque)\s*(camere|camera da letto|camere da letto)/,
  ])

  if (explicit) return explicit

  let count = 0

  if (hasAny(text, ['camera matrimoniale', 'matrimoniale'])) count += 1
  if (hasAny(text, ['cameretta'])) count += 1
  if (hasAny(text, ['camera singola', 'singola'])) count += 1
  if (hasAny(text, ['seconda camera'])) count = Math.max(count, 2)
  if (hasAny(text, ['terza camera'])) count = Math.max(count, 3)

  if (count > 0) return String(count)

  if (hasAny(text, ['camera'])) return '1'

  return null
}

function extractRoomsAndType(text: string, suggestions: PropertySuggestion) {
  const explicitRooms = extractNumberNear(text, [
    /(\d+|uno|una|due|tre|quattro|cinque|sei)\s*(locali|locale|vani|vano)/,
  ])

  if (explicitRooms) suggestions.rooms = explicitRooms

  if (hasAny(text, ['monolocale'])) {
    suggestions.property_type = 'monolocale'
    suggestions.rooms = '1'
    suggestions.bedrooms = suggestions.bedrooms || '0'
    return
  }

  if (hasAny(text, ['bilocale', 'bilo locale'])) {
    suggestions.property_type = 'bilocale'
    suggestions.rooms = '2'
    suggestions.bedrooms = suggestions.bedrooms || '1'
    return
  }

  if (hasAny(text, ['trilocale', 'tri locale'])) {
    suggestions.property_type = 'trilocale'
    suggestions.rooms = '3'
    return
  }

  if (hasAny(text, ['quadrilocale', 'quadri locale'])) {
    suggestions.property_type = 'quadrilocale'
    suggestions.rooms = '4'
    return
  }

  if (hasAny(text, ['attico'])) suggestions.property_type = 'attico'
  else if (hasAny(text, ['villa singola', 'villa'])) suggestions.property_type = 'villa'
  else if (hasAny(text, ['villetta'])) suggestions.property_type = 'villetta'
  else if (hasAny(text, ['casa indipendente', 'indipendente'])) suggestions.property_type = 'casa_indipendente'
  else if (hasAny(text, ['loft', 'open space', 'openspace'])) suggestions.property_type = 'loft_open_space'
  else if (hasAny(text, ['mansarda'])) suggestions.property_type = 'mansarda'
  else if (hasAny(text, ['ufficio'])) suggestions.property_type = 'ufficio'
  else if (hasAny(text, ['negozio'])) suggestions.property_type = 'negozio'
  else if (hasAny(text, ['capannone'])) suggestions.property_type = 'capannone'
  else if (hasAny(text, ['magazzino'])) suggestions.property_type = 'magazzino'
  else if (hasAny(text, ['laboratorio'])) suggestions.property_type = 'laboratorio'
  else if (hasAny(text, ['terreno edificabile'])) suggestions.property_type = 'terreno_edificabile'
  else if (hasAny(text, ['terreno agricolo'])) suggestions.property_type = 'terreno_agricolo'
  else if (hasAny(text, ['terreno'])) suggestions.property_type = 'terreno'
  else if (hasAny(text, ['appartamento'])) suggestions.property_type = 'appartamento'
}

function extractCondition(text: string, suggestions: PropertySuggestion) {
  if (hasAny(text, ['appena ristrutturato', 'completamente ristrutturato', 'ristrutturato'])) {
    suggestions.condition = 'ristrutturato'
  } else if (hasAny(text, ['nuova costruzione', 'di nuova realizzazione', 'nuovo'])) {
    suggestions.condition = 'nuovo'
  } else if (hasAny(text, ['ottimo stato', 'ottime condizioni', 'pari al nuovo'])) {
    suggestions.condition = 'ottimo'
  } else if (hasAny(text, ['buono stato', 'buone condizioni', 'ben tenuto'])) {
    suggestions.condition = 'buono'
  } else if (hasAny(text, ['da ristrutturare', 'da sistemare', 'da rivedere'])) {
    suggestions.condition = 'da_ristrutturare'
  } else if (hasAny(text, ['rustico', 'rudere'])) {
    suggestions.condition = 'rustico'
  } else if (hasAny(text, ['abitabile'])) {
    suggestions.condition = 'abitabile'
  }
}

function extractAvailability(text: string, suggestions: PropertySuggestion) {
  if (hasAny(text, ['libero subito', 'disponibile subito', 'immediatamente disponibile'])) {
    suggestions.availability = 'libero_subito'
  } else if (hasAny(text, ['libero al rogito', 'disponibile al rogito'])) {
    suggestions.availability = 'al_rogito'
  } else if (hasAny(text, ['da concordare', 'disponibilita da concordare'])) {
    suggestions.availability = 'da_concordare'
  } else if (hasAny(text, ['occupato'])) {
    suggestions.availability = 'occupato'
  } else if (hasAny(text, ['locato', 'a reddito', 'gia affittato'])) {
    suggestions.availability = 'locato'
  } else if (hasAny(text, ['libero', 'disponibile'])) {
    suggestions.availability = 'libero'
  }
}

function extractFurnished(text: string, suggestions: PropertySuggestion) {
  if (hasAny(text, ['parzialmente arredato', 'semi arredato', 'semiarredato'])) {
    suggestions.furnished_status = 'parzialmente'
  } else if (hasAny(text, ['non arredato', 'senza arredo', 'vuoto da arredi'])) {
    suggestions.furnished_status = 'no'
  } else if (hasAny(text, ['ben arredato', 'completamente arredato', 'arredato'])) {
    suggestions.furnished_status = 'si'
  }
}

function extractFeatures(text: string, suggestions: PropertySuggestion) {
  if (hasPositiveFeature(text, ['box', 'garage', 'autorimessa'], ['box', 'garage', 'autorimessa'])) {
    suggestions.has_garage = true
  }

  if (hasPositiveFeature(text, ['posto auto', 'posto macchina', 'parcheggio privato'], ['posto auto', 'posto macchina', 'parcheggio'])) {
    suggestions.has_parking = true
  }

  if (hasPositiveFeature(text, ['giardino', 'area verde privata'], ['giardino'])) {
    suggestions.has_garden = true
  }

  if (hasPositiveFeature(text, ['ascensore', 'servito da ascensore'], ['ascensore'])) {
    suggestions.has_elevator = true
  }

  if (hasAny(text, ['asta', 'all asta', 'allasta'])) {
    suggestions.is_auction = true
  }

  const balconies = extractNumberNear(text, [
    /(\d+|uno|una|due|tre|quattro|cinque)\s*(balconi|balcone)/,
  ])

  if (balconies) suggestions.balconies = balconies
  else if (hasAny(text, ['balcone', 'balconi'])) suggestions.balconies = '1'

  const terraces = extractNumberNear(text, [
    /(\d+|uno|una|due|tre|quattro|cinque)\s*(terrazzi|terrazzo|terrazze|terrazza)/,
  ])

  if (terraces) suggestions.terraces = terraces
  else if (hasAny(text, ['terrazzo', 'terrazza', 'terrazzi', 'terrazze'])) suggestions.terraces = '1'
}

function extractHeating(text: string, suggestions: PropertySuggestion) {
  if (hasAny(text, ['termoautonomo', 'riscaldamento autonomo', 'autonomo'])) {
    suggestions.heating_type = 'termoautonomo'
  } else if (hasAny(text, ['centralizzato', 'riscaldamento centralizzato'])) {
    suggestions.heating_type = 'centralizzato'
  } else if (hasAny(text, ['contabilizzato', 'semi autonomo', 'semi-autonomo', 'termovalvole'])) {
    suggestions.heating_type = 'semi_autonomo'
  } else if (hasAny(text, ['senza riscaldamento', 'riscaldamento assente'])) {
    suggestions.heating_type = 'assente'
  }

  if (hasAny(text, ['metano'])) suggestions.heating_source = 'metano'
  else if (hasAny(text, ['gpl'])) suggestions.heating_source = 'gpl'
  else if (hasAny(text, ['pompa di calore'])) suggestions.heating_source = 'pompa_calore'
  else if (hasAny(text, ['condizionatore', 'climatizzatore', 'split caldo freddo', 'caldo freddo'])) suggestions.heating_source = 'climatizzatore_caldo_freddo'
  else if (hasAny(text, ['a pavimento', 'pavimento radiante'])) suggestions.heating_source = 'pavimento'
  else if (hasAny(text, ['radiatori', 'termosifoni'])) suggestions.heating_source = 'radiatori'
  else if (hasAny(text, ['pellet'])) suggestions.heating_source = 'stufa_pellet'
  else if (hasAny(text, ['legna'])) suggestions.heating_source = 'stufa_legna'
  else if (hasAny(text, ['teleriscaldamento'])) suggestions.heating_source = 'teleriscaldamento'
  else if (hasAny(text, ['gasolio'])) suggestions.heating_source = 'gasolio'
  else if (hasAny(text, ['fotovoltaico'])) suggestions.heating_source = 'fotovoltaico_elettrico'
  else if (hasAny(text, ['gas'])) suggestions.heating_source = 'gas'
  else if (hasAny(text, ['elettrico'])) suggestions.heating_source = 'elettrico'
}

function extractCondoFees(text: string, suggestions: PropertySuggestion) {
  if (hasAny(text, [
    'spese condominiali incluse',
    'spese incluse',
    'spese comprese',
    'condominio incluso',
    'condominio incluso nel prezzo',
  ])) {
    suggestions.condo_fees = 'Incluse'
  }

  if (hasAny(text, [
    'senza spese condominiali',
    'nessuna spesa condominiale',
    'no spese condominiali',
    'zero spese condominiali',
  ])) {
    suggestions.condo_fees = 'Nessuna spesa condominiale'
    suggestions.condo_fees_amount = '0'
  }

  const amount = extractNumberNear(text, [
    /spese condominiali[^0-9]{0,80}(\d{1,5})(?:\s*€|\s*euro)?/,
    /spese[^0-9]{0,40}condominiali[^0-9]{0,80}(\d{1,5})(?:\s*€|\s*euro)?/,
    /condominio[^0-9]{0,80}(\d{1,5})(?:\s*€|\s*euro)?/,
  ])

  if (amount) {
    suggestions.condo_fees_amount = amount

    if (hasAny(text, ['/mese', 'al mese', 'mensili', 'mensile', 'mese'])) {
      suggestions.condo_fees_period = 'mese'
    } else if (hasAny(text, ['/anno', 'all anno', 'annuali', 'annue', 'annua', 'anno'])) {
      suggestions.condo_fees_period = 'anno'
    }
  }
}

export function analyzePropertyDescription(description: string): PropertySuggestion {
  const text = normalize(description)
  const suggestions: PropertySuggestion = {}

  if (!text) return suggestions

  extractRoomsAndType(text, suggestions)
  extractCondition(text, suggestions)
  extractAvailability(text, suggestions)
  extractFurnished(text, suggestions)
  extractFeatures(text, suggestions)
  extractHeating(text, suggestions)
  extractCondoFees(text, suggestions)

  const surface = extractSurface(text)
  if (surface) suggestions.surface = surface

  const bedrooms = extractBedrooms(text)
  if (bedrooms) suggestions.bedrooms = bedrooms

  const bathrooms = extractBathrooms(text)
  if (bathrooms) suggestions.bathrooms = bathrooms

  const floor = extractFloor(text)
  if (floor) suggestions.floor = floor

  const totalFloors = extractTotalFloors(text)
  if (totalFloors) suggestions.total_floors = totalFloors

  return suggestions
}
