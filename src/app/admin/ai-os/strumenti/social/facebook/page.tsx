 'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Platform = 'facebook' | 'instagram' | 'tiktok'
type SocialLayout = 'two' | 'four'

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

const AREA_SOCIAL_LOGO_SRC = '/images/brand/areaimmobiliare.png'

const PLATFORM_CONFIG: Record<Platform, {
  label: string
  ratioLabel: string
  width: number
  height: number
  filename: string
}> = {
  facebook: {
    label: 'Facebook',
    ratioLabel: '1200x630',
    width: 1200,
    height: 630,
    filename: 'facebook-1200x630',
  },
  instagram: {
    label: 'Instagram',
    ratioLabel: '1:1 1080x1080',
    width: 1080,
    height: 1080,
    filename: 'instagram-1x1',
  },
  tiktok: {
    label: 'TikTok',
    ratioLabel: '9:16 1080x1920',
    width: 1080,
    height: 1920,
    filename: 'tiktok-9x16',
  },
}

function clean(value: unknown, fallback = '—') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
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
    .slice(0, 90) || 'social-immobile'
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

function drawRoundedCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.save()
  drawRoundedRect(ctx, x, y, width, height, radius)
  ctx.clip()
  drawCoverImage(ctx, img, x, y, width, height)
  ctx.restore()
}

function drawImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
) {
  ctx.save()
  ctx.fillStyle = '#1F2937'
  drawRoundedRect(ctx, x, y, width, height, 22)
  ctx.fill()

  ctx.strokeStyle = 'rgba(143,188,187,0.45)'
  ctx.lineWidth = 3
  drawRoundedRect(ctx, x + 10, y + 10, width - 20, height - 20, 18)
  ctx.stroke()

  ctx.fillStyle = '#D8DEE9'
  ctx.font = `800 ${Math.max(18, Math.min(30, width / 11))}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + width / 2, y + height / 2)
  ctx.restore()
}

function drawContainedLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (!logo) {
    ctx.fillStyle = '#111827'
    ctx.font = `900 ${Math.max(20, Math.min(30, width / 4.9))}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('AREA', x + width / 2, y + height / 2)
    return
  }

  const padding = Math.max(8, Math.min(16, width * 0.1))
  const availableW = width - padding * 2
  const availableH = height - padding * 2
  const logoRatio = logo.width / logo.height
  const boxRatio = availableW / availableH

  let drawW = availableW
  let drawH = availableH

  if (logoRatio > boxRatio) {
    drawH = drawW / logoRatio
  } else {
    drawW = drawH * logoRatio
  }

  const drawX = x + (width - drawW) / 2
  const drawY = y + (height - drawH) / 2

  ctx.drawImage(logo, drawX, drawY, drawW, drawH)
}

function drawCenteredWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
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

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, y + index * lineHeight)
  })

  return y + lines.length * lineHeight
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  fontSize: number,
) {
  ctx.font = `800 ${fontSize}px Arial`
  const paddingX = fontSize * 0.9
  const width = ctx.measureText(text).width + paddingX * 2
  const height = fontSize * 1.9
  const x = centerX - width / 2

  ctx.fillStyle = 'rgba(235,203,139,0.08)'
  drawRoundedRect(ctx, x, y, width, height, height / 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(235,203,139,0.42)'
  ctx.lineWidth = Math.max(1, fontSize / 14)
  ctx.stroke()

  ctx.fillStyle = '#EBCB8B'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, centerX, y + fontSize * 1.28)

  return width
}

function drawSoftGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.035)'
  ctx.lineWidth = 1

  const step = Math.max(90, Math.round(width / 10))

  for (let x = 0; x <= width; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y <= height; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.restore()
}

function drawMainFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const margin = Math.max(26, Math.round(Math.min(width, height) * 0.048))
  const radius = Math.max(24, Math.round(Math.min(width, height) * 0.045))

  ctx.strokeStyle = 'rgba(236,239,244,0.12)'
  ctx.lineWidth = 1.5
  drawRoundedRect(ctx, margin, margin, width - margin * 2, height - margin * 2, radius)
  ctx.stroke()
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

function getLayoutBoxes(platform: Platform, layout: SocialLayout, width: number, height: number) {
  if (platform === 'facebook') {
    if (layout === 'four') {
      return {
        boxes: [
          { x: 66, y: 108, w: 224, h: 210 },
          { x: 66, y: 340, w: 224, h: 210 },
          { x: width - 66 - 224, y: 108, w: 224, h: 210 },
          { x: width - 66 - 224, y: 340, w: 224, h: 210 },
        ],
        content: { x: 342, y: 68, w: 516, h: 512 },
      }
    }

    return {
      boxes: [
        { x: 58, y: 64, w: 330, h: height - 128 },
        { x: width - 58 - 330, y: 64, w: 330, h: height - 128 },
      ],
      content: { x: 404, y: 66, w: 392, h: height - 132 },
    }
  }

  if (platform === 'instagram') {
    if (layout === 'four') {
      return {
        boxes: [
          { x: 56, y: 122, w: 238, h: 276 },
          { x: 56, y: height - 122 - 276, w: 238, h: 276 },
          { x: width - 56 - 238, y: 122, w: 238, h: 276 },
          { x: width - 56 - 238, y: height - 122 - 276, w: 238, h: 276 },
        ],
        content: { x: 326, y: 110, w: 428, h: 860 },
      }
    }

    return {
      boxes: [
        { x: 54, y: 220, w: 310, h: 640 },
        { x: width - 54 - 310, y: 220, w: 310, h: 640 },
      ],
      content: { x: 386, y: 132, w: 308, h: 816 },
    }
  }

  if (layout === 'four') {
    return {
      boxes: [
        { x: 72, y: 132, w: 428, h: 330 },
        { x: 580, y: 132, w: 428, h: 330 },
        { x: 72, y: height - 132 - 330, w: 428, h: 330 },
        { x: 580, y: height - 132 - 330, w: 428, h: 330 },
      ],
      content: { x: 132, y: 560, w: width - 264, h: 800 },
    }
  }

  return {
    boxes: [
      { x: 86, y: 120, w: width - 172, h: 460 },
      { x: 86, y: height - 120 - 460, w: width - 172, h: 460 },
    ],
    content: { x: 132, y: 660, w: width - 264, h: 620 },
  }
}

function drawContentPanel(
  ctx: CanvasRenderingContext2D,
  input: {
    platform: Platform
    layout: SocialLayout
    x: number
    y: number
    w: number
    h: number
    title: string
    ref: string
    price: string
    contract: string
    location: string
    features: string
    description: string
    tags: string[]
    logo: HTMLImageElement | null
  },
) {
  const {
    platform,
    layout,
    x,
    y,
    w,
    h,
    title,
    ref,
    price,
    contract,
    location,
    features,
    description,
    tags,
    logo,
  } = input

  const centerX = x + w / 2
  const isVertical = platform === 'tiktok'
  const isSquare = platform === 'instagram'
  const scale = platform === 'facebook' ? 1 : platform === 'instagram' ? 1.12 : 1.34
  const compact = platform === 'instagram' && layout === 'two'

  if (layout === 'two' || platform !== 'facebook') {
    ctx.fillStyle = 'rgba(7,11,20,0.96)'
    drawRoundedRect(ctx, x, y, w, h, isVertical ? 34 : 26)
    ctx.fill()

    ctx.strokeStyle = 'rgba(163,190,140,0.50)'
    ctx.lineWidth = 1.6
    drawRoundedRect(ctx, x, y, w, h, isVertical ? 34 : 26)
    ctx.stroke()
  }

  const chipFont = Math.max(15, Math.round(16 * scale))
  const shownTags = tags.slice(0, platform === 'tiktok' ? 3 : 4)
  const chipGap = Math.max(8, Math.round(10 * scale))
  const chipWidths = shownTags.map((tag) => {
    ctx.font = `800 ${chipFont}px Arial`
    return ctx.measureText(tag).width + chipFont * 1.8
  })
  const totalChipWidth = chipWidths.reduce((total, item) => total + item, 0) + chipGap * Math.max(0, chipWidths.length - 1)

  if (layout === 'four' && platform !== 'tiktok') {
    let chipX = centerX - totalChipWidth / 2
    shownTags.forEach((tag, index) => {
      const chipWidth = chipWidths[index] ?? 0
      drawChip(ctx, tag, chipX + chipWidth / 2, y + 2, chipFont)
      chipX += chipWidth + chipGap
    })
  }

  let cursorY = y + (layout === 'four' && platform !== 'tiktok' ? 70 * scale : 48 * scale)

  ctx.textAlign = 'center'

  ctx.fillStyle = '#C4A15A'
  ctx.font = `800 ${Math.round((compact ? 13 : 16) * scale)}px Arial`
  ctx.fillText('A R E A   I M M O B I L I A R E', centerX, cursorY)

  cursorY += compact ? 48 : 58 * scale

  ctx.fillStyle = '#FFFFFF'
  ctx.font = `900 ${Math.round((compact ? 25 : 34) * scale)}px Arial`
  cursorY = drawCenteredWrappedText(
    ctx,
    title.toUpperCase(),
    centerX,
    cursorY,
    w - Math.max(42, 70 * scale),
    Math.round((compact ? 30 : 38) * scale),
    isVertical ? 3 : 2,
  )

  cursorY += compact ? 30 : 42 * scale

  ctx.fillStyle = '#D8DEE9'
  ctx.font = `800 ${Math.round((compact ? 16 : 19) * scale)}px Arial`
  cursorY = drawCenteredWrappedText(
    ctx,
    location,
    centerX,
    cursorY,
    w - Math.max(40, 64 * scale),
    Math.round((compact ? 21 : 26) * scale),
    2,
  )

  cursorY += compact ? 30 : 42 * scale

  ctx.fillStyle = '#EBCB8B'
  ctx.font = `900 ${Math.round((compact ? 27 : 34) * scale)}px Arial`
  ctx.fillText(price, centerX, cursorY)

  cursorY += compact ? 40 : 58 * scale

  ctx.fillStyle = '#D1D5DB'
  ctx.font = `800 ${Math.round((compact ? 15 : 18) * scale)}px Arial`
  cursorY = drawCenteredWrappedText(
    ctx,
    features,
    centerX,
    cursorY,
    w - Math.max(44, 74 * scale),
    Math.round((compact ? 21 : 25) * scale),
    isVertical ? 3 : 2,
  )

  const remainingToFooter = y + h - cursorY
  const canDrawDescription = remainingToFooter > (isVertical ? 230 : 150)

  if (description && canDrawDescription) {
    cursorY += compact ? 28 : 36 * scale

    ctx.fillStyle = '#D1D5DB'
    ctx.font = `700 ${Math.round((compact ? 15 : 18) * scale)}px Arial`
    drawCenteredWrappedText(
      ctx,
      description,
      centerX,
      cursorY,
      w - Math.max(48, 78 * scale),
      Math.round((compact ? 21 : 25) * scale),
      isVertical ? 4 : 3,
    )
  }

  const footerY = y + h - Math.max(82, 108 * scale)
  ctx.strokeStyle = 'rgba(236,239,244,0.13)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + Math.max(32, 46 * scale), footerY - 18)
  ctx.lineTo(x + w - Math.max(32, 46 * scale), footerY - 18)
  ctx.stroke()

  const logoW = Math.min(w * 0.32, Math.max(104, 126 * scale))
  const logoH = Math.min(72 * scale, Math.max(52, 60 * scale))
  const logoX = x + Math.max(28, 38 * scale)
  const logoY = footerY

  ctx.fillStyle = '#FFFFFF'
  drawRoundedRect(ctx, logoX, logoY, logoW, logoH, 12)
  ctx.fill()
  drawContainedLogo(ctx, logo, logoX, logoY, logoW, logoH)

  const infoX = logoX + logoW + Math.max(16, 22 * scale)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `800 ${Math.round(16 * scale)}px Arial`
  ctx.fillText('Area Immobiliare', infoX, footerY + 20 * scale)

  ctx.fillStyle = '#D1D5DB'
  ctx.font = `700 ${Math.round(13 * scale)}px Arial`
  ctx.fillText('Bergamo · Via Locatelli, 62', infoX, footerY + 43 * scale)

  ctx.fillStyle = '#EBCB8B'
  ctx.font = `900 ${Math.round(14 * scale)}px Arial`
  ctx.fillText('035 237979 · 035 221206', infoX, footerY + 64 * scale)
}

export default function SocialImagesPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [propertyId, setPropertyId] = useState('')
  const [data, setData] = useState<ToolPropertyData | null>(null)
  const [platform, setPlatform] = useState<Platform>('facebook')
  const [layout, setLayout] = useState<SocialLayout>('two')
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [notice, setNotice] = useState('')
  const [photoSlots, setPhotoSlots] = useState<number[]>([0, 1, 2, 3])
  const [areaLogo, setAreaLogo] = useState<HTMLImageElement | null>(null)

  const property = data?.property ?? null
  const config = PLATFORM_CONFIG[platform]

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

  function currentSlotIndex(slotIndex: number) {
    if (images.length === 0) return 0

    const raw = Number(photoSlots[slotIndex] ?? slotIndex)
    return ((raw % images.length) + images.length) % images.length
  }

  function cyclePhotoSlot(slotIndex: number, direction = 1) {
    if (images.length === 0) {
      setNotice('Nessuna foto disponibile per questo immobile.')
      return
    }

    setPhotoSlots((current) => {
      const next = [...current]
      const currentValue = Number(next[slotIndex] ?? slotIndex)
      next[slotIndex] = ((currentValue + direction) % images.length + images.length) % images.length
      return next
    })

    setNotice(`Foto ${slotIndex + 1} cambiata.`)
  }

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
      setPhotoSlots([0, 1, 2, 3])
    } catch (error) {
      setData(null)
      setNotice(error instanceof Error ? error.message : 'Errore caricamento immobile')
    } finally {
      setLoading(false)
    }
  }

  async function generateImage(nextPlatform = platform, nextLayout = layout) {
    if (!property) {
      setNotice('Seleziona prima un immobile.')
      return
    }

    setGenerating(true)
    setNotice('Creo immagine social...')

    try {
      const canvas = canvasRef.current
      const nextConfig = PLATFORM_CONFIG[nextPlatform]

      if (!canvas) throw new Error('Canvas non disponibile')

      const width = nextConfig.width
      const height = nextConfig.height

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas non disponibile')

      const selectedImageUrls = (nextLayout === 'four' ? [0, 1, 2, 3] : [0, 1])
        .map((slotIndex) => images[currentSlotIndex(slotIndex)])
        .filter(Boolean)

      const loadedImages: HTMLImageElement[] = []

      for (const src of selectedImageUrls) {
        try {
          loadedImages.push(await loadImage(src))
        } catch {
          // Se una foto non passa CORS o non si carica, uso placeholder.
        }
      }

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#030507'
      ctx.fillRect(0, 0, width, height)
      drawSoftGrid(ctx, width, height)
      drawMainFrame(ctx, width, height)

      const title = clean(property.title, 'Immobile Area Immobiliare')
      const ref = clean(property.reference_code, 'Rif. —')
      const price = formatCurrency(property.price)
      const contract = formatContract(property.contract_type)
      const location = shortLocation(property)
      const features = featureLine(property)
      const typeLabel = clean(property.property_type, 'Immobile')
      const description = clean(property.description, '')
      const descriptionLimit = nextPlatform === 'tiktok' ? 210 : nextPlatform === 'instagram' ? 170 : 150
      const shortDescription = description.length > descriptionLimit
        ? `${description.slice(0, descriptionLimit).trim()}...`
        : description

      const tags = [
        normalize(property.contract_type) === 'vendita' ? 'Vendita' : normalize(property.contract_type) === 'affitto' ? 'Affitto' : 'Immobile',
        typeLabel,
        property.has_garage ? 'Box / Garage' : '',
        property.has_garden ? 'Giardino' : '',
        property.has_parking ? 'Posto auto' : '',
      ]
        .filter(Boolean)
        .slice(0, 4)
        .map((tag) => String(tag).length > 17 ? `${String(tag).slice(0, 15)}...` : String(tag))

      const layoutData = getLayoutBoxes(nextPlatform, nextLayout, width, height)

      layoutData.boxes.forEach((box, index) => {
        const img = loadedImages[index]

        if (img) {
          drawRoundedCoverImage(ctx, img, box.x, box.y, box.w, box.h, Math.max(20, Math.min(box.w, box.h) * 0.08))
        } else {
          drawImagePlaceholder(ctx, box.x, box.y, box.w, box.h, `FOTO ${index + 1}`)
        }
      })

      if (nextLayout === 'two') {
        const firstBox = layoutData.boxes[0]
        const lastBox = layoutData.boxes[layoutData.boxes.length - 1]

        if (firstBox && lastBox) {
          if (nextPlatform === 'tiktok') {
            const topGradient = ctx.createLinearGradient(0, firstBox.y + firstBox.h - 120, 0, layoutData.content.y)
            topGradient.addColorStop(0, 'rgba(3,5,7,0)')
            topGradient.addColorStop(1, '#030507')
            ctx.fillStyle = topGradient
            ctx.fillRect(0, firstBox.y + firstBox.h - 120, width, layoutData.content.y - firstBox.y - firstBox.h + 120)

            const bottomGradient = ctx.createLinearGradient(0, layoutData.content.y + layoutData.content.h, 0, lastBox.y + 120)
            bottomGradient.addColorStop(0, '#030507')
            bottomGradient.addColorStop(1, 'rgba(3,5,7,0)')
            ctx.fillStyle = bottomGradient
            ctx.fillRect(0, layoutData.content.y + layoutData.content.h, width, lastBox.y + 120 - (layoutData.content.y + layoutData.content.h))
          } else {
            const gradientLeft = ctx.createLinearGradient(firstBox.x + firstBox.w - 96, 0, layoutData.content.x, 0)
            gradientLeft.addColorStop(0, 'rgba(3,5,7,0)')
            gradientLeft.addColorStop(1, '#030507')
            ctx.fillStyle = gradientLeft
            ctx.fillRect(firstBox.x + firstBox.w - 96, 0, layoutData.content.x - (firstBox.x + firstBox.w - 96), height)

            const gradientRight = ctx.createLinearGradient(layoutData.content.x + layoutData.content.w, 0, lastBox.x + 96, 0)
            gradientRight.addColorStop(0, '#030507')
            gradientRight.addColorStop(1, 'rgba(3,5,7,0)')
            ctx.fillStyle = gradientRight
            ctx.fillRect(layoutData.content.x + layoutData.content.w, 0, lastBox.x + 96 - (layoutData.content.x + layoutData.content.w), height)
          }
        }
      }

      drawContentPanel(ctx, {
        platform: nextPlatform,
        layout: nextLayout,
        x: layoutData.content.x,
        y: layoutData.content.y,
        w: layoutData.content.w,
        h: layoutData.content.h,
        title,
        ref,
        price,
        contract,
        location,
        features,
        description: shortDescription,
        tags,
        logo: areaLogo,
      })

      const url = canvas.toDataURL('image/png')
      setPreviewUrl(url)
      setNotice(`Immagine ${nextConfig.label} pronta.`)
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
    const layoutName = layout === 'four' ? '4-foto' : '2-foto'
    const link = document.createElement('a')
    link.href = previewUrl
    link.download = `${ref}-${config.filename}-${layoutName}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  useEffect(() => {
    async function loadAreaLogo() {
      if (!AREA_SOCIAL_LOGO_SRC) return

      try {
        const logo = await loadImage(AREA_SOCIAL_LOGO_SRC)
        setAreaLogo(logo)
      } catch {
        setAreaLogo(null)
      }
    }

    void loadAreaLogo()
  }, [])

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
      void generateImage(platform, layout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, layout, property?.id, photoSlots, areaLogo])

  return (
    <main className="min-h-screen bg-[#111827] px-4 py-6 text-[#E5E7EB] md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[30px] border border-[#8FBCBB]/20 bg-[#1F2937]/88 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.36em] text-[#8FBCBB]/75">
            AI-OS / Social
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Crea immagini social
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#D1D5DB]/68">
            Genera immagini per Facebook, Instagram e TikTok usando le foto dell’immobile.
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
              onClick={() => void generateImage(platform, layout)}
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
            Formato
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPlatform(item)}
                className={`rounded-2xl border p-4 text-left transition ${
                  platform === item
                    ? 'border-[#A3BE8C]/60 bg-[#A3BE8C]/14'
                    : 'border-[#374151] bg-[#111827]/70 hover:border-[#8FBCBB]/45'
                }`}
              >
                <p className="font-black text-white">{PLATFORM_CONFIG[item].label}</p>
                <p className="mt-1 text-xs leading-5 text-[#D1D5DB]/58">{PLATFORM_CONFIG[item].ratioLabel}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
            Layout
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setLayout('two')}
              className={`rounded-2xl border p-4 text-left transition ${
                layout === 'two'
                  ? 'border-[#A3BE8C]/60 bg-[#A3BE8C]/14'
                  : 'border-[#374151] bg-[#111827]/70 hover:border-[#8FBCBB]/45'
              }`}
            >
              <p className="font-black text-white">Versione 2 foto</p>
              <p className="mt-1 text-xs leading-5 text-[#D1D5DB]/58">
                Due immagini e testo centrale adattato al formato scelto.
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
                Quattro miniature e testo centrale premium.
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

        {property && images.length > 0 ? (
          <section className="mb-6 rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
              Foto usate nel layout
            </p>
            <p className="mt-1 text-xs leading-5 text-[#D1D5DB]/58">
              Clicca una miniatura per cambiare quella foto. Shift + click torna alla foto precedente.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {(layout === 'four' ? [0, 1, 2, 3] : [0, 1]).map((slotIndex) => {
                const imageIndex = currentSlotIndex(slotIndex)
                const imageUrl = images[imageIndex]

                return (
                  <button
                    key={slotIndex}
                    type="button"
                    onClick={(event) => cyclePhotoSlot(slotIndex, event.shiftKey ? -1 : 1)}
                    className="group overflow-hidden rounded-2xl border border-[#374151] bg-[#111827] text-left transition hover:border-[#A3BE8C]/60"
                    title="Clicca per cambiare foto"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-[#0B1220]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`Foto layout ${slotIndex + 1}`}
                          className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs font-bold text-[#D1D5DB]/50">
                          Foto mancante
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-xs font-black text-white">Foto {slotIndex + 1}</p>
                      <p className="text-[11px] text-[#A3BE8C]">Immagine {imageIndex + 1} di {images.length}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                Anteprima
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                {config.label} {config.ratioLabel}
              </h2>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Anteprima immagine ${config.label}`}
              className="mx-auto max-h-[78vh] rounded-2xl border border-[#374151] bg-[#0B1220] object-contain shadow-2xl shadow-black/30"
              style={{ width: platform === 'tiktok' ? 'min(420px, 100%)' : '100%' }}
            />
          ) : (
            <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-[#374151] bg-[#0B1220] text-sm text-[#D1D5DB]/58">
              Seleziona/genera un’immagine social.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
