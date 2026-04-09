import fs from 'fs/promises'
import path from 'path'
import * as XLSX from 'xlsx'

const ISTAT_XLSX_URL =
  'https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx'

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'it', { sensitivity: 'base' })
  )
}

async function main() {
  const response = await fetch(ISTAT_XLSX_URL)

  if (!response.ok) {
    throw new Error(`Errore download XLSX ISTAT: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer' })

  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    throw new Error('Nessun foglio trovato nel file ISTAT')
  }

  const worksheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: '',
  })

  if (!rows || rows.length < 2) {
    throw new Error('File ISTAT vuoto o non valido')
  }

  const headerRowIndex = rows.findIndex(
    (row) =>
      Array.isArray(row) &&
      row[10] &&
      normalizeText(row[10]) === 'Denominazione Regione'
  )

  if (headerRowIndex === -1) {
    throw new Error('Intestazione non trovata nel file ISTAT')
  }

  const headers = rows[headerRowIndex].map((cell) => normalizeText(cell))

  const regionIndex = 10
  const provinceNameIndex = 11
  const provinceCodeIndex = 14
  const comuneNameIndex = 6
  const comuneCodeIndex = 4

  if (
    !headers[regionIndex] ||
    !headers[provinceNameIndex] ||
    !headers[provinceCodeIndex] ||
    !headers[comuneNameIndex] ||
    !headers[comuneCodeIndex]
  ) {
    console.log('Headers trovati:')
    headers.forEach((header, index) => {
      console.log(`${index}: ${header}`)
    })
    throw new Error('Struttura XLSX ISTAT inattesa')
  }

  const provinceMap = new Map()

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!Array.isArray(row) || row.length === 0) continue

    const regione = normalizeText(row[regionIndex])
    const provinciaName = normalizeText(row[provinceNameIndex])
    const provinciaCode = normalizeText(row[provinceCodeIndex]).toUpperCase()
    const comuneName = normalizeText(row[comuneNameIndex])
    const comuneCode = normalizeText(row[comuneCodeIndex])

    if (!provinciaName || !provinciaCode || !comuneName) continue

    const provinceKey = `${provinciaName}__${provinciaCode}`

    if (!provinceMap.has(provinceKey)) {
      provinceMap.set(provinceKey, {
        name: provinciaName,
        code: provinciaCode,
        region: regione,
        comuni: [],
      })
    }

    provinceMap.get(provinceKey).comuni.push({
      name: comuneName,
      code: comuneCode,
    })
  }

  const provinces = [...provinceMap.values()]
    .map((province) => ({
      name: province.name,
      code: province.code,
      region: province.region,
      comuni: uniqueSorted(province.comuni.map((c) => c.name)).map((name) => {
        const found = province.comuni.find((c) => c.name === name)
        return {
          name,
          code: found?.code || '',
        }
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }))

  const output = {
    source: ISTAT_XLSX_URL,
    generatedAt: new Date().toISOString(),
    provinces,
  }

  const outputDir = path.resolve('src/data')
  const outputFile = path.join(outputDir, 'italyLocations.json')

  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(outputFile, JSON.stringify(output, null, 2), 'utf8')

  console.log(`Creato: ${outputFile}`)
  console.log(`Province: ${provinces.length}`)
  console.log(
    `Comuni totali: ${provinces.reduce((sum, p) => sum + p.comuni.length, 0)}`
  )
  console.log(
    'Esempio province:',
    provinces.slice(0, 10).map((p) => `${p.name} (${p.code})`)
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})