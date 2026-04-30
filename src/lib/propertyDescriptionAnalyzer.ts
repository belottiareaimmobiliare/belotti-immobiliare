type PropertySuggestion = Record<string, string | boolean>

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word))
}

function extractNumberNear(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

function extractFloor(text: string) {
  if (hasAny(text, ['piano terra', 'p.t.', 'pt '])) return 'Piano terra'
  if (hasAny(text, ['primo piano', '1 piano', '1° piano'])) return '1'
  if (hasAny(text, ['secondo piano', '2 piano', '2° piano'])) return '2'
  if (hasAny(text, ['terzo piano', '3 piano', '3° piano'])) return '3'
  if (hasAny(text, ['quarto piano', '4 piano', '4° piano'])) return '4'
  if (hasAny(text, ['quinto piano', '5 piano', '5° piano'])) return '5'
  if (hasAny(text, ['ultimo piano'])) return 'Ultimo piano'

  return null
}

export function analyzePropertyDescription(description: string): PropertySuggestion {
  const text = normalize(description)
  const suggestions: PropertySuggestion = {}

  if (!text.trim()) return suggestions

  // Tipologia e locali
  if (hasAny(text, ['monolocale'])) {
    suggestions.property_type = 'monolocale'
    suggestions.rooms = '1'
  } else if (hasAny(text, ['bilocale'])) {
    suggestions.property_type = 'bilocale'
    suggestions.rooms = '2'
  } else if (hasAny(text, ['trilocale'])) {
    suggestions.property_type = 'trilocale'
    suggestions.rooms = '3'
  } else if (hasAny(text, ['quadrilocale'])) {
    suggestions.property_type = 'quadrilocale'
    suggestions.rooms = '4'
  } else if (hasAny(text, ['attico'])) {
    suggestions.property_type = 'attico'
  } else if (hasAny(text, ['villa', 'villetta'])) {
    suggestions.property_type = 'villa'
  } else if (hasAny(text, ['ufficio'])) {
    suggestions.property_type = 'ufficio'
  } else if (hasAny(text, ['negozio'])) {
    suggestions.property_type = 'negozio'
  } else if (hasAny(text, ['terreno edificabile'])) {
    suggestions.property_type = 'terreno_edificabile'
  } else if (hasAny(text, ['terreno agricolo'])) {
    suggestions.property_type = 'terreno_agricolo'
  } else if (hasAny(text, ['terreno'])) {
    suggestions.property_type = 'terreno'
  } else if (hasAny(text, ['appartamento'])) {
    suggestions.property_type = 'appartamento'
  }

  // Stato immobile
  if (hasAny(text, ['ristrutturato', 'appena ristrutturato'])) {
    suggestions.condition = 'ristrutturato'
  } else if (hasAny(text, ['nuova costruzione', 'nuovo'])) {
    suggestions.condition = 'nuovo'
  } else if (hasAny(text, ['ottimo stato', 'ottime condizioni'])) {
    suggestions.condition = 'ottimo'
  } else if (hasAny(text, ['buono stato', 'buone condizioni'])) {
    suggestions.condition = 'buono'
  } else if (hasAny(text, ['da ristrutturare'])) {
    suggestions.condition = 'da_ristrutturare'
  } else if (hasAny(text, ['rustico', 'rudere'])) {
    suggestions.condition = 'rustico'
  } else if (hasAny(text, ['abitabile'])) {
    suggestions.condition = 'abitabile'
  }

  // Disponibilità
  if (hasAny(text, ['libero subito', 'disponibile subito'])) {
    suggestions.availability = 'libero_subito'
  } else if (hasAny(text, ['libero'])) {
    suggestions.availability = 'libero'
  } else if (hasAny(text, ['occupato'])) {
    suggestions.availability = 'occupato'
  } else if (hasAny(text, ['locato', 'a reddito'])) {
    suggestions.availability = 'locato'
  } else if (hasAny(text, ['al rogito'])) {
    suggestions.availability = 'al_rogito'
  } else if (hasAny(text, ['da concordare'])) {
    suggestions.availability = 'da_concordare'
  }

  // Arredamento
  if (hasAny(text, ['parzialmente arredato', 'semi arredato', 'semiarredato'])) {
    suggestions.furnished_status = 'parzialmente'
  } else if (hasAny(text, ['non arredato', 'senza arredo'])) {
    suggestions.furnished_status = 'no'
  } else if (hasAny(text, ['arredato', 'ben arredato', 'completamente arredato'])) {
    suggestions.furnished_status = 'si'
  }

  // Caratteristiche
  if (hasAny(text, ['box', 'garage', 'autorimessa'])) suggestions.has_garage = true
  if (hasAny(text, ['posto auto', 'posto macchina'])) suggestions.has_parking = true
  if (hasAny(text, ['giardino'])) suggestions.has_garden = true
  if (hasAny(text, ['ascensore']) && !hasAny(text, ['senza ascensore', 'privo di ascensore'])) {
    suggestions.has_elevator = true
  }
  if (hasAny(text, ['asta', 'all asta', "all'asta"])) suggestions.is_auction = true

  if (hasAny(text, ['balcone', 'balconi'])) suggestions.balconies = '1'
  if (hasAny(text, ['terrazzo', 'terrazza', 'terrazzi'])) suggestions.terraces = '1'

  // Riscaldamento
  if (hasAny(text, ['termoautonomo', 'riscaldamento autonomo', 'autonomo'])) {
    suggestions.heating_type = 'termoautonomo'
  } else if (hasAny(text, ['centralizzato', 'riscaldamento centralizzato'])) {
    suggestions.heating_type = 'centralizzato'
  } else if (hasAny(text, ['contabilizzato', 'semi autonomo', 'semi-autonomo'])) {
    suggestions.heating_type = 'semi_autonomo'
  } else if (hasAny(text, ['senza riscaldamento', 'riscaldamento assente'])) {
    suggestions.heating_type = 'assente'
  }

  if (hasAny(text, ['metano'])) suggestions.heating_source = 'metano'
  else if (hasAny(text, ['gpl'])) suggestions.heating_source = 'gpl'
  else if (hasAny(text, ['pompa di calore'])) suggestions.heating_source = 'pompa_calore'
  else if (hasAny(text, ['condizionatore', 'climatizzatore', 'caldo/freddo'])) suggestions.heating_source = 'climatizzatore_caldo_freddo'
  else if (hasAny(text, ['a pavimento', 'pavimento radiante'])) suggestions.heating_source = 'pavimento'
  else if (hasAny(text, ['radiatori', 'termosifoni'])) suggestions.heating_source = 'radiatori'
  else if (hasAny(text, ['pellet'])) suggestions.heating_source = 'stufa_pellet'
  else if (hasAny(text, ['legna'])) suggestions.heating_source = 'stufa_legna'
  else if (hasAny(text, ['teleriscaldamento'])) suggestions.heating_source = 'teleriscaldamento'
  else if (hasAny(text, ['gasolio'])) suggestions.heating_source = 'gasolio'
  else if (hasAny(text, ['fotovoltaico'])) suggestions.heating_source = 'fotovoltaico_elettrico'
  else if (hasAny(text, ['gas'])) suggestions.heating_source = 'gas'
  else if (hasAny(text, ['elettrico'])) suggestions.heating_source = 'elettrico'

  // Numeri semplici
  const surface = extractNumberNear(text, [
    /(\d{2,4})\s*mq/,
    /mq\s*(\d{2,4})/,
    /(\d{2,4})\s*metri quadrati/,
  ])
  if (surface) suggestions.surface = surface

  const bedrooms = extractNumberNear(text, [
    /(\d+)\s*camere/,
    /(\d+)\s*camera/,
  ])
  if (bedrooms) suggestions.bedrooms = bedrooms

  const bathrooms = extractNumberNear(text, [
    /(\d+)\s*bagni/,
    /(\d+)\s*bagno/,
  ])
  if (bathrooms) suggestions.bathrooms = bathrooms

  const floor = extractFloor(text)
  if (floor) suggestions.floor = floor

  return suggestions
}
