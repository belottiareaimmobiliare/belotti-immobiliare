'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type FacebookLayout = 'four' | 'side-text-side'

type PropertyMedia = {
  id: string
  media_type?: string | null
  file_url?: string | null
  label?: string | null
  sort_order?: number | null
  is_cover?: boolean | null
}

type ToolPropertyData = {
  property: Record<string, any>
  propertyMedia: PropertyMedia[]
}

function clean(value: unknown, fallback = '—') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function formatCurrency(value: unknown) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount <= 0) return 'Prezzo su richiesta'

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function formatContract(value: unknown) {
  const contract = normalize(value)
  if (contract === 'vendita') return 'IN VENDITA'
  if (contract === 'affitto') return 'IN AFFITTO'
  return 'IMMOBILE'
}

function shortLocation(property: Record<string, any>) {
  return [property.comune || property.city, property.province].filter(Boolean).join(' · ') || 'Area Immobiliare'
}

function featureLine(property: Record<string, any>) {
  return [
    property.surface ? `${property.surface} mq` : '',
    property.rooms ? `${property.rooms} locali` : '',
    property.bathrooms ? `${property.bathrooms} bagni` : '',
    property.energy_class ? `Classe ${property.energy_class}` : '',
  ].filter(Boolean).join(' · ') || 'Dettagli in agenzia'
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'facebook-immobile'
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)

  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = img.width / img.height
  const boxRatio = width / height

  let sx = 0
  let sy = 0
  let sw = img.width
  let sh = img.height

  if (imageRatio > boxRatio) {
    sw = img.height * boxRatio
    sx = (img.width - sw) / 2
  } else {
    sh = img.width / boxRatio
    sy = (img.height - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height)
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word

    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
      continue
    }

    if (current) {
      lines.push(current)
      current = word
    } else {
      lines.push(word)
      current = ''
    }

    if (lines.length >= maxLines) break
  }

  if (current && lines.length < maxLines) {
    lines.push(current)
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })

  return y + lines.length * lineHeight
}

async function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Immagine non caricabile: ${url}`))
    img.src = url
  })
}

function drawImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
) {
  ctx.fillStyle = '#1F2937'
  ctx.fillRect(x, y, width, height)

  ctx.strokeStyle = 'rgba(143,188,187,0.45)'
  ctx.lineWidth = 3
  ctx.strokeRect(x + 10, y + 10, width - 20, height - 20)

  ctx.fillStyle = '#D8DEE9'
  ctx.font = '700 24px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(label, x + width / 2, y + height / 2)
}

export default function FacebookImagesPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [propertyId, setPropertyId] = useState('')
  const [data, setData] = useState<ToolPropertyData | null>(null)
  const [layout, setLayout] = useState<FacebookLayout>('side-text-side')
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [notice, setNotice] = useState('')

  const property = data?.property ?? null

  const images = useMemo(() => {
    const media = data?.propertyMedia ?? []

    return [...media]
      .filter((item) => item.media_type === 'image' && item.file_url)
      .sort((a, b) => {
        if (a.is_cover && !b.is_cover) return -1
        if (!a.is_cover && b.is_cover) return 1
        return Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
      })
      .map((item) => String(item.file_url))
  }, [data])

  async function loadProperty(nextPropertyId: string) {
    if (!nextPropertyId) return

    setLoading(true)
    setNotice('')

    try {
      const response = await fetch(`/api/admin/ai-os/tools/property/${nextPropertyId}`, {
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Errore caricamento immobile')
      }

      setData({
        property: payload.property,
        propertyMedia: Array.isArray(payload.propertyMedia) ? payload.propertyMedia : [],
      })
    } catch (error) {
      setData(null)
      setNotice(error instanceof Error ? error.message : 'Errore caricamento immobile')
    } finally {
      setLoading(false)
    }
  }

  async function generateImage(nextLayout = layout) {
    if (!property) {
      setNotice('Seleziona prima un immobile.')
      return
    }

    setGenerating(true)
    setNotice('Creo immagine Facebook...')

    try {
      const canvas = canvasRef.current

      if (!canvas) throw new Error('Canvas non disponibile')

      const width = 1200
      const height = 630
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas non disponibile')

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#111827'
      ctx.fillRect(0, 0, width, height)

      const loadedImages: HTMLImageElement[] = []

      for (const src of images.slice(0, 4)) {
        try {
          loadedImages.push(await loadImage(src))
        } catch {
          // se una foto non passa CORS o non si carica, uso placeholder
        }
      }

      const title = clean(property.title, 'Immobile Area Immobiliare')
      const ref = clean(property.reference_code, 'Rif. —')
      const price = formatCurrency(property.price)
      const contract = formatContract(property.contract_type)
      const location = shortLocation(property)
      const features = featureLine(property)

      if (nextLayout === 'four') {
        const gap = 14
        const boxW = (width - gap * 3) / 2
        const boxH = (height - gap * 3) / 2

        const boxes = [
          { x: gap, y: gap },
          { x: gap * 2 + boxW, y: gap },
          { x: gap, y: gap * 2 + boxH },
          { x: gap * 2 + boxW, y: gap * 2 + boxH },
        ]

        boxes.forEach((box, index) => {
          const img = loadedImages[index]

          if (img) {
            drawCoverImage(ctx, img, box.x, box.y, boxW, boxH)
          } else {
            drawImagePlaceholder(ctx, box.x, box.y, boxW, boxH, 'AREA IMMOBILIARE')
          }
        })

        const overlayY = 438
        const gradient = ctx.createLinearGradient(0, overlayY, 0, height)
        gradient.addColorStop(0, 'rgba(17,24,39,0)')
        gradient.addColorStop(0.35, 'rgba(17,24,39,0.78)')
        gradient.addColorStop(1, 'rgba(17,24,39,0.96)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, overlayY, width, height - overlayY)

        ctx.fillStyle = '#A3BE8C'
        ctx.font = '800 24px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`${contract} · ${ref}`, 44, 500)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 42px Arial'
        drawWrappedText(ctx, title, 44, 552, 760, 46, 2)

        ctx.textAlign = 'right'
        ctx.fillStyle = '#EBCB8B'
        ctx.font = '900 40px Arial'
        ctx.fillText(price, 1156, 552)

        ctx.fillStyle = '#D8DEE9'
        ctx.font = '700 22px Arial'
        ctx.fillText(location, 1156, 590)
      } else {
        const sideW = 355
        const centerX = sideW
        const centerW = width - sideW * 2

        const leftImage = loadedImages[0]
        const rightImage = loadedImages[1] || loadedImages[0]

        if (leftImage) {
          drawCoverImage(ctx, leftImage, 0, 0, sideW, height)
        } else {
          drawImagePlaceholder(ctx, 0, 0, sideW, height, 'FOTO 1')
        }

        if (rightImage) {
          drawCoverImage(ctx, rightImage, width - sideW, 0, sideW, height)
        } else {
          drawImagePlaceholder(ctx, width - sideW, 0, sideW, height, 'FOTO 2')
        }

        const gradientLeft = ctx.createLinearGradient(sideW - 80, 0, sideW, 0)
        gradientLeft.addColorStop(0, 'rgba(17,24,39,0)')
        gradientLeft.addColorStop(1, '#111827')
        ctx.fillStyle = gradientLeft
        ctx.fillRect(sideW - 80, 0, 80, height)

        const gradientRight = ctx.createLinearGradient(width - sideW, 0, width - sideW + 80, 0)
        gradientRight.addColorStop(0, '#111827')
        gradientRight.addColorStop(1, 'rgba(17,24,39,0)')
        ctx.fillStyle = gradientRight
        ctx.fillRect(width - sideW, 0, 80, height)

        ctx.fillStyle = '#111827'
        ctx.fillRect(centerX, 0, centerW, height)

        ctx.strokeStyle = 'rgba(163,190,140,0.42)'
        ctx.lineWidth = 2
        drawRoundedRect(ctx, centerX + 32, 38, centerW - 64, height - 76, 28)
        ctx.stroke()

        ctx.textAlign = 'center'

        ctx.fillStyle = '#8FBCBB'
        ctx.font = '800 22px Arial'
        ctx.fillText('AREA IMMOBILIARE', width / 2, 92)

        ctx.fillStyle = '#A3BE8C'
        ctx.font = '900 26px Arial'
        ctx.fillText(`${contract} · ${ref}`, width / 2, 140)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 39px Arial'
        const titleEnd = drawWrappedText(ctx, title.toUpperCase(), centerX + 48, 208, centerW - 96, 44, 3)

        ctx.fillStyle = '#D8DEE9'
        ctx.font = '700 21px Arial'
        drawWrappedText(ctx, features, centerX + 56, titleEnd + 30, centerW - 112, 28, 3)

        ctx.fillStyle = '#EBCB8B'
        ctx.font = '900 39px Arial'
        ctx.fillText(price, width / 2, 510)

        ctx.fillStyle = '#D8DEE9'
        ctx.font = '700 22px Arial'
        ctx.fillText(location, width / 2, 552)

        ctx.fillStyle = '#8FBCBB'
        ctx.font = '700 18px Arial'
        ctx.fillText('Contattaci per info e visite', width / 2, 594)
      }

      const url = canvas.toDataURL('image/png')
      setPreviewUrl(url)
      setNotice('Immagine Facebook pronta.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore generazione immagine')
    } finally {
      setGenerating(false)
    }
  }

  function downloadImage() {
    if (!previewUrl || !property) {
      setNotice('Genera prima l’immagine.')
      return
    }

    const ref = safeFilename(clean(property.reference_code, 'immobile'))
    const name = layout === 'four' ? 'facebook-4-foto' : 'facebook-2-foto-testo-centro'

    const link = document.createElement('a')
    link.href = previewUrl
    link.download = `${ref}-${name}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('propertyId') || ''

    setPropertyId(fromUrl)

    if (fromUrl) {
      void loadProperty(fromUrl)
    }
  }, [])

  useEffect(() => {
    if (property) {
      void generateImage(layout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, property?.id])

  return (
    <main className="min-h-screen bg-[#111827] px-4 py-6 text-[#E5E7EB] md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[30px] border border-[#8FBCBB]/20 bg-[#1F2937]/88 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.36em] text-[#8FBCBB]/75">
            AI-OS / Social
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Crea immagini Facebook
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#D1D5DB]/68">
            Genera immagini 1200x630 per Facebook usando le foto dell’immobile.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.href = propertyId ? `/admin/ai-os/strumenti/social?propertyId=${propertyId}` : '/admin/ai-os/strumenti/social'}
              className="rounded-full border border-[#8FBCBB]/30 bg-[#8FBCBB]/10 px-4 py-2 text-sm font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18"
            >
              Torna a Social / Vetrina
            </button>

            <button
              type="button"
              disabled={!property || generating}
              onClick={() => void generateImage(layout)}
              className="rounded-full border border-[#A3BE8C]/40 bg-[#A3BE8C]/12 px-4 py-2 text-sm font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/20 disabled:cursor-wait disabled:opacity-50"
            >
              {generating ? 'Genero...' : 'Rigenera immagine'}
            </button>

            <button
              type="button"
              disabled={!previewUrl}
              onClick={downloadImage}
              className="rounded-full border border-[#EBCB8B]/35 bg-[#EBCB8B]/10 px-4 py-2 text-sm font-bold text-[#EBCB8B] transition hover:bg-[#EBCB8B]/18 disabled:opacity-40"
            >
              Scarica PNG
            </button>
          </div>
        </header>

        {notice ? (
          <div className="mb-5 rounded-2xl border border-[#8FBCBB]/20 bg-[#0B1220]/90 px-4 py-3 text-sm font-semibold leading-6 text-[#D8DEE9]">
            {notice}
          </div>
        ) : null}

        <section className="mb-6 rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
            Layout Facebook
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setLayout('side-text-side')}
              className={`rounded-2xl border p-4 text-left transition ${
                layout === 'side-text-side'
                  ? 'border-[#A3BE8C]/60 bg-[#A3BE8C]/14'
                  : 'border-[#374151] bg-[#111827]/70 hover:border-[#8FBCBB]/45'
              }`}
            >
              <p className="font-black text-white">1 foto sinistra + testo centro + 1 foto destra</p>
              <p className="mt-1 text-xs leading-5 text-[#D1D5DB]/58">
                Layout Facebook più pulito, con testo centrale e due immagini laterali.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setLayout('four')}
              className={`rounded-2xl border p-4 text-left transition ${
                layout === 'four'
                  ? 'border-[#A3BE8C]/60 bg-[#A3BE8C]/14'
                  : 'border-[#374151] bg-[#111827]/70 hover:border-[#8FBCBB]/45'
              }`}
            >
              <p className="font-black text-white">Versione 4 foto</p>
              <p className="mt-1 text-xs leading-5 text-[#D1D5DB]/58">
                Griglia 2x2 con overlay testo, prezzo e riferimento.
              </p>
            </button>
          </div>

          {loading ? (
            <div className="mt-4 rounded-2xl border border-[#374151] bg-[#111827]/70 p-4 text-sm text-[#D1D5DB]/62">
              Caricamento immobile...
            </div>
          ) : null}

          {property ? (
            <div className="mt-4 rounded-2xl border border-[#8FBCBB]/18 bg-[#111827]/70 p-4 text-sm text-[#D1D5DB]/70">
              <span className="font-black text-white">{clean(property.reference_code)} - {clean(property.title)}</span>
              <span className="ml-2 text-[#A3BE8C]">{images.length} foto disponibili</span>
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                Anteprima
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                Facebook 1200x630
              </h2>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Anteprima immagine Facebook"
              className="w-full rounded-2xl border border-[#374151] bg-[#0B1220] shadow-2xl shadow-black/30"
            />
          ) : (
            <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-[#374151] bg-[#0B1220] text-sm text-[#D1D5DB]/58">
              Seleziona/genera un’immagine Facebook.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
