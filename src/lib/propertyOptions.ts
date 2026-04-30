export type PropertyTypeOption = {
  value: string
  label: string
  category:
    | 'residenziale'
    | 'commerciale'
    | 'terreno'
    | 'pertinenza'
    | 'altro'
}

export const PROPERTY_TYPES: PropertyTypeOption[] = [
  { value: 'appartamento', label: 'Appartamento', category: 'residenziale' },
  { value: 'monolocale', label: 'Monolocale', category: 'residenziale' },
  { value: 'bilocale', label: 'Bilocale', category: 'residenziale' },
  { value: 'trilocale', label: 'Trilocale', category: 'residenziale' },
  { value: 'quadrilocale', label: 'Quadrilocale', category: 'residenziale' },
  { value: 'plurilocale', label: 'Plurilocale', category: 'residenziale' },
  { value: 'attico', label: 'Attico', category: 'residenziale' },
  { value: 'mansarda', label: 'Mansarda', category: 'residenziale' },
  { value: 'loft_open_space', label: 'Loft / Open space', category: 'residenziale' },
  { value: 'villa', label: 'Villa', category: 'residenziale' },
  { value: 'villetta', label: 'Villetta', category: 'residenziale' },
  { value: 'casa_indipendente', label: 'Casa indipendente', category: 'residenziale' },
  { value: 'rustico_casale', label: 'Rustico / Casale', category: 'residenziale' },
  { value: 'palazzo_stabile', label: 'Palazzo / Stabile', category: 'residenziale' },

  { value: 'terreno', label: 'Terreno', category: 'terreno' },
  { value: 'terreno_edificabile', label: 'Terreno edificabile', category: 'terreno' },
  { value: 'terreno_agricolo', label: 'Terreno agricolo', category: 'terreno' },

  { value: 'ufficio', label: 'Ufficio', category: 'commerciale' },
  { value: 'studio_professionale', label: 'Studio professionale', category: 'commerciale' },
  { value: 'negozio', label: 'Negozio', category: 'commerciale' },
  { value: 'locale_commerciale', label: 'Locale commerciale', category: 'commerciale' },
  { value: 'open_space', label: 'Open space', category: 'commerciale' },
  { value: 'capannone', label: 'Capannone', category: 'commerciale' },
  { value: 'magazzino', label: 'Magazzino', category: 'commerciale' },
  { value: 'laboratorio', label: 'Laboratorio', category: 'commerciale' },

  { value: 'box_garage', label: 'Box / Garage', category: 'pertinenza' },
  { value: 'posto_auto', label: 'Posto auto', category: 'pertinenza' },

  { value: 'altro', label: 'Altro', category: 'altro' },
]

export function formatPropertyTypeLabel(
  value: string | null | undefined,
  fallback = 'Tipologia da definire'
) {
  const clean = String(value || '').trim()

  if (!clean) return fallback

  return (
    PROPERTY_TYPES.find((item) => item.value === clean)?.label ||
    clean
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
}

export function getPropertyTypeCategory(value: string | null | undefined) {
  const clean = String(value || '').trim()

  return PROPERTY_TYPES.find((item) => item.value === clean)?.category || 'altro'
}
