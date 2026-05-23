import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const RAW_JSON = path.resolve('tmp/area-portali-audit/audit-doppioni-immobili-importati.json')
const OUT_MD = path.resolve('tmp/area-portali-audit/audit-doppioni-immobili-importati-finale.md')
const OUT_JSON = path.resolve('tmp/area-portali-audit/audit-doppioni-immobili-importati-finale.json')

const LEGITIMATE_GROUPS = [
  {
    name: 'Via Roma 85 Gorle - unità ufficio distinte',
    refs: ['IM0029AA', 'IM0030AA', 'IM0031AA'],
    reason:
      'Stesso indirizzo e stesso complesso, ma metrature, prezzi e descrizioni diverse: 250 mq centro medico, 400 mq direzionale, 120 mq convertibile in attico.',
  },
]

function collectRefs(value, refs = new Set()) {
  if (value == null) return refs

  if (typeof value === 'string') {
    for (const match of value.matchAll(/\bIM\d{4}AA\b/g)) {
      refs.add(match[0])
    }
    return refs
  }

  if (Array.isArray(value)) {
    for (const item of value) collectRefs(item, refs)
    return refs
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (
        ['reference_code', 'referenceCode', 'ref', 'REF'].includes(key) &&
        typeof nested === 'string' &&
        /^IM\d{4}AA$/.test(nested)
      ) {
        refs.add(nested)
      }
      collectRefs(nested, refs)
    }
  }

  return refs
}

function sameRefSet(a, b) {
  if (a.size !== b.length) return false
  return b.every((ref) => a.has(ref))
}

function isLegitimateGroup(group) {
  const refs = collectRefs(group)
  return LEGITIMATE_GROUPS.find((allowed) => sameRefSet(refs, allowed.refs))
}

function rowText(group) {
  const lines = []
  const json = JSON.stringify(group, null, 2)
  for (const ref of collectRefs(group)) {
    const regex = new RegExp(`.{0,160}${ref}.{0,260}`, 'g')
    const matches = json.match(regex) || []
    for (const match of matches.slice(0, 3)) {
      lines.push(match.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim())
    }
  }
  return [...new Set(lines)]
}

function main() {
  if (!fs.existsSync(RAW_JSON)) {
    console.log('Report raw non trovato, rilancio audit:portali:duplicates...')
    execSync('npm run audit:portali:duplicates', { stdio: 'inherit' })
  }

  const raw = JSON.parse(fs.readFileSync(RAW_JSON, 'utf8'))

  const realProblems = Array.isArray(raw.realProblems) ? raw.realProblems : []
  const review = Array.isArray(raw.review) ? raw.review : []

  const legitimate = []
  const remainingReview = []

  for (const group of review) {
    const allowed = isLegitimateGroup(group)
    if (allowed) {
      legitimate.push({ allowed, group })
    } else {
      remainingReview.push(group)
    }
  }

  const result = {
    generated_at: new Date().toISOString(),
    raw_summary: raw.summary || {},
    final_summary: {
      realProblems: realProblems.length,
      reviewRemaining: remainingReview.length,
      legitimateGroups: legitimate.length,
    },
    realProblems,
    reviewRemaining: remainingReview,
    legitimateGroups: legitimate,
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2), 'utf8')

  const md = []
  md.push('# Audit finale doppioni immobili importati')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push('## Riepilogo finale')
  md.push('')
  md.push(`- Problemi forti reali: **${realProblems.length}**`)
  md.push(`- Gruppi ancora da verificare: **${remainingReview.length}**`)
  md.push(`- Gruppi riconosciuti come legittimi/stesso stabile: **${legitimate.length}**`)
  md.push('')

  md.push('## Problemi forti')
  md.push('')
  if (!realProblems.length) {
    md.push('Nessun problema forte trovato.')
  } else {
    md.push('```json')
    md.push(JSON.stringify(realProblems, null, 2))
    md.push('```')
  }
  md.push('')

  md.push('## Gruppi ancora da verificare')
  md.push('')
  if (!remainingReview.length) {
    md.push('Nessun gruppo sospetto residuo.')
  } else {
    for (const group of remainingReview) {
      md.push('```json')
      md.push(JSON.stringify(group, null, 2))
      md.push('```')
      md.push('')
    }
  }

  md.push('## Gruppi legittimi esclusi dai sospetti')
  md.push('')
  if (!legitimate.length) {
    md.push('Nessun gruppo legittimo configurato/trovato.')
  } else {
    for (const item of legitimate) {
      md.push(`### ${item.allowed.name}`)
      md.push('')
      md.push(`REF: \`${item.allowed.refs.join('`, `')}\``)
      md.push('')
      md.push(`Motivo: ${item.allowed.reason}`)
      md.push('')
      const lines = rowText(item.group)
      if (lines.length) {
        md.push('Dettaglio rilevato:')
        md.push('')
        for (const line of lines) md.push(`- ${line}`)
        md.push('')
      }
    }
  }

  md.push('## Decisione')
  md.push('')
  if (!realProblems.length && !remainingReview.length) {
    md.push('OK: non risultano doppioni reali da correggere sugli immobili importati.')
  } else {
    md.push('ATTENZIONE: restano elementi da verificare prima della pubblicazione.')
  }
  md.push('')

  fs.writeFileSync(OUT_MD, md.join('\n') + '\n', 'utf8')

  console.log('=== AUDIT FINALE DOPPIONI CREATO ===')
  console.log(OUT_MD)
  console.log(OUT_JSON)
  console.log('')
  console.log(md.slice(0, 140).join('\n'))

  if (realProblems.length || remainingReview.length) {
    process.exitCode = 1
  }
}

main()
