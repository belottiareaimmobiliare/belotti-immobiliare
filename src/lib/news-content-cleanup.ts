export function cleanPublicNewsHtml(content: string | null | undefined) {
  if (!content?.trim()) return '<p>Contenuto non disponibile.</p>'

  let html = content.trim()

  // Rimuove il blocco HTML generato da AI News con il link PDF completo.
  // Il link resta disponibile tramite bottone "Apri fonte".
  html = html.replace(
    /<p>\s*<strong>\s*Fonte PDF completa:\s*<\/strong>\s*<br\s*\/?>\s*<a\b[^>]*>[\s\S]*?<\/a>\s*<\/p>/gi,
    ''
  )

  // Rimuove eventuale versione testuale/plain finita dentro HTML.
  html = html.replace(
    /Fonte PDF completa:\s*(<br\s*\/?>|\n|\s)*https?:\/\/[^\s<]+/gi,
    ''
  )

  html = html.replace(
    /Fonte PDF completa\s*(<br\s*\/?>|\n|\s)*https?:\/\/[^\s<]+/gi,
    ''
  )

  return html.trim() || '<p>Contenuto non disponibile.</p>'
}
